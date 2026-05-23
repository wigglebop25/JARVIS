import { useState, useEffect, useCallback } from 'react';
import * as chatService from '@/services/chatService';
import { ChatResponse, Session } from '@/types/tauri';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: number;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session management
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const list = await chatService.getChatProviders();
        setProviders(list);
        if (list.length > 0) setActiveProvider(list[0]);
      } catch (err) {
        console.error("Failed to load chat providers:", err);
      }
    };
    loadProviders();
  }, []);

  // Initialize session on mount: fetch existing sessions or create a new one
  useEffect(() => {
    const initSession = async () => {
      try {
        const existingSessions = await chatService.listSessions();
        setSessions(existingSessions);

        if (existingSessions.length > 0) {
          // Resume the most recent session
          const latest = existingSessions[0];
          setActiveSessionId(latest.id);

          // Load its history into the message log
          try {
            const history = await chatService.getHistory(latest.id);
            const restoredMessages: Message[] = history.map((msg, i) => ({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
              timestamp: Date.now() - (history.length - i) * 1000, // approximate ordering
            }));
            setMessages(restoredMessages);
          } catch (histErr) {
            console.warn("Failed to load session history:", histErr);
          }
        } else {
          // No sessions exist yet, create one
          const newId = await chatService.createSession("Default Session");
          setActiveSessionId(newId);
          setSessions([{ id: newId, title: "Default Session", created_at: Date.now(), updated_at: Date.now() }]);
        }
      } catch (err) {
        console.error("Failed to initialize session:", err);
        // If backend is unreachable, operate in a degraded "no session" mode
      }
    };
    initSession();
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Ensure we have a session ID. If not, create one on-the-fly.
      let sessionId = activeSessionId;
      if (!sessionId) {
        sessionId = await chatService.createSession("Auto Session");
        setActiveSessionId(sessionId);
      }

      const response: ChatResponse = await chatService.sendPrompt(sessionId, content);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
        provider: response.provider,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId]);

  const updateProvider = useCallback(async (provider: string) => {
    try {
      await chatService.setChatProvider(provider);
      setActiveProvider(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const createNewSession = useCallback(async (title?: string) => {
    try {
      const newId = await chatService.createSession(title || "New Session");
      setActiveSessionId(newId);
      setMessages([]);
      const updated = await chatService.listSessions();
      setSessions(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const switchSession = useCallback(async (sessionId: string) => {
    try {
      setActiveSessionId(sessionId);
      const history = await chatService.getHistory(sessionId);
      const restoredMessages: Message[] = history.map((msg, i) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        timestamp: Date.now() - (history.length - i) * 1000,
      }));
      setMessages(restoredMessages);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    providers,
    activeProvider,
    isLoading,
    error,
    sendMessage,
    updateProvider,
    clearHistory,
    // Session management
    activeSessionId,
    sessions,
    createNewSession,
    switchSession,
  };
};
