import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { sendPrompt, createSession, listSessions, getHistory, renameSession, deleteSession } from '@/services/chatService';
import { Session, RigMessage } from '@/types/tauri';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
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
  sendMessage: (overrideText?: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ─── Helpers ────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'jarvis',
  text: 'SYSTEM_BOOT: Local MCP Node active. All neural links air-gapped. How can I assist?',
};

/** Parse rig::message::Message content structure dynamically */
const parseContent = (content: any): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.text || item.content || '';
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

/** Map backend RigMessage[] → frontend Message[] */
const mapHistory = (history: RigMessage[]): Message[] =>
  history.map((msg, i) => ({
    id: `hist-${i}-${Date.now()}`,
    sender: msg.role === 'user' ? 'user' : 'jarvis',
    text: parseContent(msg.content),
  }));

// ─── Provider ───────────────────────────────────────────────────────────────

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState('');
  const initRef = useRef(false);

  // ── Boot: load sessions or create first one ──
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
          // No sessions exist — create the first one
          await createFirstSession();
        }
      } catch (err) {
        console.warn('[SessionContext] Init failed, creating local session:', err);
        await createFirstSession();
      }
    };

    init();
  }, []);

  const createFirstSession = async () => {
    try {
      const id = await createSession('New Session');
      const newSession: Session = {
        id,
        title: 'New Session',
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      setSessions([newSession]);
      setActiveSessionId(id);
      setMessages([WELCOME_MESSAGE]);
    } catch (err) {
      console.error('[SessionContext] Failed to create first session:', err);
    }
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
    try {
      const id = await createSession('New Session');
      setActiveSessionId(id);
      setMessages([WELCOME_MESSAGE]);
      setInput('');
      await refreshSessions();
    } catch (err) {
      console.error('[SessionContext] Failed to create session:', err);
    }
  }, [refreshSessions]);

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
    try {
      await deleteSession(sessionId);
      
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      
      // If we deleted the active session, pick another or create a new one
      if (activeSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          const nextActive = updatedSessions[0];
          setActiveSessionId(nextActive.id);
          await loadSessionHistory(nextActive.id);
        } else {
          // No sessions left — create a new one
          await createFirstSession();
        }
      } else {
        await refreshSessions();
      }
    } catch (err) {
      console.error('[SessionContext] Failed to delete session:', err);
    }
  }, [sessions, activeSessionId, refreshSessions]);

  // ── Send message ──
  const sendMessage = useCallback(async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || isThinking) return;

    const userMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    let responseText: string;

    try {
      // Ensure we have a session
      let sid = activeSessionId;
      if (!sid) {
        sid = await createSession('New Session');
        setActiveSessionId(sid);
      }

      // Auto-title: if this is the first user message in the session, 
      // use the text as the session title (truncated)
      const isFirstMessage = messages.filter(m => m.sender === 'user').length === 0;
      if (isFirstMessage) {
        const truncatedTitle = textToSend.length > 40 
          ? textToSend.substring(0, 40) + '...' 
          : textToSend;
        
        try {
          await renameSession(sid, truncatedTitle);
        } catch (err) {
          console.error('[SessionContext] Failed to rename session on backend:', err);
        }
      }

      const response = await sendPrompt(sid, textToSend);
      responseText = response.message;
    } catch (err) {
      console.error('[SessionContext] Prompt failed:', err);
      responseText = `SYSTEM_ERROR: Backend unreachable — ${err}`;
    }

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      sender: 'jarvis',
      text: responseText,
    };

    setMessages(prev => [...prev, botMsg]);
    setIsThinking(false);

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
