import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { streamPrompt, countTokens, createSession, listSessions, getHistory, renameSession, deleteSession } from '@/services/chatService';
import { Session, RigMessage } from '@/types/tauri';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ToolCall {
  name: string;
  args: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  tokenCount?: number;
  toolCalls?: ToolCall[];
}

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

// ─── Helpers ────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'jarvis',
  text: 'SYSTEM_BOOT: Local Air-Gapped Node active. All neural links secure. How can I assist?',
};

/** Check if a message is a tool result (should not render as user prompt) */
const isToolResultMessage = (content: any): boolean => {
  if (!Array.isArray(content)) return false;
  return content.some((item: any) => item?.type === 'toolresult');
};

/** Extract text only from content (skips tool calls and tool results) */
const parseContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          if (item.function || item.type === 'toolresult') return '';
          if (typeof item.text === 'string') return item.text;
          if (Array.isArray(item.content)) {
            return item.content.map((sub: any) => sub?.text || '').filter(Boolean).join('\n');
          }
          if (typeof item.content === 'string') return item.content;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

/** Extract tool calls from a content array */
const extractToolCalls = (content: any): ToolCall[] => {
  if (!Array.isArray(content)) return [];
  return content
    .filter((item: any) => item?.function && typeof item.function === 'object')
    .map((item: any) => ({
      name: item.function.name || 'unknown',
      args: item.function.arguments
        ? typeof item.function.arguments === 'string'
          ? item.function.arguments
          : JSON.stringify(item.function.arguments)
        : '',
    }));
};

/** Map backend RigMessage[] → frontend Message[], consolidating consecutive assistant messages */
const mapHistory = (history: RigMessage[]): Message[] => {
  const filtered = history.filter((msg) => !isToolResultMessage(msg.content));
  const result: Message[] = [];

  for (const msg of filtered) {
    const isAssistant = msg.role === 'assistant' || msg.role === 'model';
    const text = parseContent(msg.content);
    const toolCalls = extractToolCalls(msg.content);
    const prev = result[result.length - 1];

    if (isAssistant && prev && prev.sender === 'jarvis') {
      // Consolidate into previous assistant message
      if (text) prev.text = prev.text ? prev.text + '\n' + text : text;
      if (toolCalls.length > 0) {
        prev.toolCalls = [...(prev.toolCalls || []), ...toolCalls];
      }
    } else {
      result.push({
        id: `hist-${result.length}-${Date.now()}`,
        sender: isAssistant ? 'jarvis' : 'user',
        text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      });
    }
  }

  return result;
};

// ─── Provider ───────────────────────────────────────────────────────────────

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState('');
  const initRef = useRef(false);

  // ── Boot: load sessions or set draft state ──
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      try {
        const existingSessions = await listSessions();

        if (existingSessions.length > 0) {
          setSessions(existingSessions);
          // Auto-select the most recent session
          const latest = existingSessions[0]; // Already ordered by updated_at DESC
          setActiveSessionId(latest.id);
          await loadSessionHistory(latest.id);
        } else {
          // No sessions exist — start in draft mode
          prepareDraftSession();
        }
      } catch (err) {
        console.warn('[SessionContext] Init failed, setting local draft session:', err);
        prepareDraftSession();
      }
    };

    init();
  }, []);

  const prepareDraftSession = () => {
    setActiveSessionId(null);
    setMessages([WELCOME_MESSAGE]);
  };

  const loadSessionHistory = async (sessionId: string) => {
    try {
      const history = await getHistory(sessionId);
      if (history.length > 0) {
        setMessages([WELCOME_MESSAGE, ...mapHistory(history)]);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (err) {
      console.error('[SessionContext] Failed to load history:', err);
      setMessages([WELCOME_MESSAGE]);
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
        loadSessionHistory(nextActive.id);
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
      text: displayMessage,
      tokenCount: userTokensCount
    };
    const botMsg: Message = {
      id: assistantId,
      sender: 'jarvis',
      text: '',
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

      let accumulatedText = '';
      let hasTokens = false;

      const response = await streamPrompt(sid, textToSend, attachments || null, (token) => {
        if (!hasTokens) {
          setIsThinking(false);
          hasTokens = true;
        }
        accumulatedText += token;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: accumulatedText } : m));
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
          return { ...m, text: response.message, tokenCount: responseTokens };
        }
        return m;
      }));

    } catch (err) {
      console.error('[SessionContext] Prompt failed:', err);
      setMessages(prev => prev.map(m => {
        if (m.id === assistantId) {
          return { ...m, text: `SYSTEM_ERROR: Backend unreachable — ${err}` };
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
