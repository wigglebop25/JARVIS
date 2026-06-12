import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { streamPrompt, countTokens, createSession, listSessions, getHistory, renameSession, deleteSession } from '@/services/chatService';
import { Session } from '@/types/tauri';
import { mapHistory, reduceStreamEvent } from '@/features/chat';
import type { Message, ToolCall } from '@/features/chat';

// ─── Types ──────────────────────────────────────────────────────────────────

export type { Message, ToolCall };

interface SessionContextType {
  // Session list
  sessions: Session[];
  activeSessionId: string | null;

  // Chat state
  messages: Message[];
  isThinking: boolean;
  input: string;
  setInput: (val: string) => void;

  // Actions
  createNewSession: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  sendMessage: (overrideText?: string, attachments?: string[]) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState('');
  const initRef = useRef(false);

  // ── Boot: load sessions list but always start with a new draft session ──
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const existingSessions = await listSessions();
        setSessions(existingSessions);
      } catch (err) {
        console.warn('[SessionContext] Init failed to load sessions:', err);
      }
      // Always start with a fresh draft session
      prepareDraftSession();
    };

    init();
  }, []);

  const prepareDraftSession = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const loadSessionHistory = async (sessionId: string) => {
    try {
      const history = await getHistory(sessionId);
      if (history.length > 0) {
        setMessages(mapHistory(history));
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('[SessionContext] Failed to load history:', err);
      setMessages([]);
    }
  };

  // ── Refresh session list from backend ──
  const refreshSessions = useCallback(async () => {
    try {
      const updated = await listSessions();
      setSessions(updated);
    } catch (err) {
      console.error('[SessionContext] Failed to refresh sessions:', err);
    }
  }, []);

  // ── Create new session ──
  const createNewSession = useCallback(async () => {
    // If we're already on an empty draft, just clear the input and do nothing
    const hasUserMessages = messages.some(m => m.sender === 'user');
    if (!activeSessionId && !hasUserMessages) {
      setInput('');
      return;
    }

    prepareDraftSession();
    setInput('');
  }, [activeSessionId, messages]);

  // ── Switch to existing session ──
  const switchSession = useCallback(async (sessionId: string) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setInput('');
    setIsThinking(false);
    await loadSessionHistory(sessionId);
  }, [activeSessionId]);

  // ── Rename session ──
  const handleRenameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      await renameSession(sessionId, newTitle);
      await refreshSessions();
    } catch (err) {
      console.error('[SessionContext] Failed to rename session:', err);
    }
  }, [refreshSessions]);

  // ── Delete session ──
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    // 1. Optimistic update: instantly remove from list and update active selection
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(updatedSessions);
    
    if (activeSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        const nextActive = updatedSessions[0];
        setActiveSessionId(nextActive.id);
        await loadSessionHistory(nextActive.id);
      } else {
        prepareDraftSession();
      }
    }

    // 2. Perform backend deletion in background
    try {
      await deleteSession(sessionId);
      const updated = await listSessions();
      setSessions(updated);
    } catch (err) {
      console.error('[SessionContext] Failed to delete session on backend:', err);
    }
  }, [sessions, activeSessionId]);

  // ── Send message ──
  const sendMessage = useCallback(async (overrideText?: string, attachments?: string[]) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend && (!attachments || attachments.length === 0)) return;
    if (isThinking) return;

    // Format the message with attached paths for backward-compatible text storage
    let displayMessage = textToSend;
    if (attachments && attachments.length > 0) {
      const attachmentsHeader = attachments.map(path => `[Attached: ${path}]`).join('\n');
      displayMessage = `${attachmentsHeader}\n${textToSend}`;
    }

    // Calculate initial user tokens
    let userTokensCount = 0;
    try {
      const countRes = await countTokens(textToSend);
      userTokensCount = countRes.prompt_tokens;
    } catch (e) {
      userTokensCount = Math.ceil(textToSend.length / 4);
    }

    const userId = `user-${Date.now()}`;
    const assistantId = `bot-${Date.now()}`;

    const userMsg: Message = { 
      id: userId, 
      sender: 'user', 
      parts: [{ kind: 'text', content: displayMessage }],
      tokenCount: userTokensCount
    };
    const botMsg: Message = {
      id: assistantId,
      sender: 'jarvis',
      parts: [],
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
    setIsThinking(true);

    try {
      // Ensure we have a session
      let sid = activeSessionId;
      if (!sid) {
        const initialTitle = textToSend.length > 40 
          ? textToSend.substring(0, 40) + '...' 
          : textToSend || 'Document Query';
        sid = await createSession(initialTitle);
        setActiveSessionId(sid);
      } else {
        // Auto-title: if this is the first user message in the session, 
        // use the text as the session title (truncated)
        const isFirstMessage = messages.filter(m => m.sender === 'user').length === 0;
        if (isFirstMessage) {
          const truncatedTitle = textToSend.length > 40 
            ? textToSend.substring(0, 40) + '...' 
            : textToSend || 'Document Query';
          
          try {
            await renameSession(sid, truncatedTitle);
          } catch (err) {
            console.error('[SessionContext] Failed to rename session on backend:', err);
          }
        }
      }

      let hasEvents = false;

      const response = await streamPrompt(sid, textToSend, attachments || null, (ev) => {
        if (!hasEvents) {
          setIsThinking(false);
          hasEvents = true;
        }
        setMessages(prev => prev.map(m => m.id === assistantId ? reduceStreamEvent(m, ev) : m));
      });

      // Get exact final token counts
      let finalPromptTokens = userTokensCount;
      let responseTokens = 0;
      try {
        const tokenRes = await countTokens(textToSend, response.message);
        finalPromptTokens = tokenRes.prompt_tokens;
        responseTokens = tokenRes.response_tokens;
      } catch (err) {
        console.warn("Failed to get exact final token counts:", err);
        responseTokens = Math.ceil(response.message.length / 4);
      }

      setMessages(prev => prev.map(m => {
        if (m.id === userId) {
          return { ...m, tokenCount: finalPromptTokens };
        }
        if (m.id === assistantId) {
          const hasTextPart = m.parts.some(p => p.kind === 'text');
          return {
            ...m,
            parts: hasTextPart ? m.parts : [{ kind: 'text', content: response.message }],
            tokenCount: responseTokens,
          };
        }
        return m;
      }));

    } catch (err) {
      console.error('[SessionContext] Prompt failed:', err);
      setMessages(prev => prev.map(m => {
        if (m.id === assistantId) {
          return { ...m, parts: [{ kind: 'text', content: `SYSTEM_ERROR: Backend unreachable — ${err}` }] };
        }
        return m;
      }));
    } finally {
      setIsThinking(false);
    }

    // Refresh session list to update ordering and titles
    await refreshSessions();
  }, [input, isThinking, activeSessionId, messages, refreshSessions]);

  return (
    <SessionContext.Provider value={{
      sessions,
      activeSessionId,
      messages,
      isThinking,
      input,
      setInput,
      createNewSession,
      switchSession,
      sendMessage,
      renameSession: handleRenameSession,
      deleteSession: handleDeleteSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
