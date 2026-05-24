import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/tauri';
import { listSessions, getHistory } from '@/services/chatService';

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
}

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load all sessions and filter out empty ones
  const loadSessions = useCallback(async () => {
    try {
      const list = await listSessions();
      
      // Filter out empty sessions that have no conversation history
      const nonDrafts: Session[] = [];
      
      // Use Promise.all to fetch history in parallel for speed
      const histories = await Promise.all(
        list.map(s => getHistory(s.id).catch(() => []))
      );
      
      list.forEach((s, idx) => {
        if (histories[idx] && histories[idx].length > 0) {
          nonDrafts.push(s);
        }
      });

      // Sort sessions by updated_at descending
      const sorted = [...nonDrafts].sort((a, b) => b.updated_at - a.updated_at);
      setSessions(sorted);
      return sorted;
    } catch (err) {
      console.error("[useChatSessions] Failed to list sessions:", err);
      return [];
    }
  }, []);

  // Load message history for a specific session
  const loadHistory = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const history = await getHistory(sessionId);
      const formatted: Message[] = history.map((msg, index) => ({
        id: `${sessionId}-${index}`,
        sender: msg.role === 'assistant' || msg.role === 'model' ? 'jarvis' : 'user',
        text: msg.content,
      }));

      // Add a friendly boot welcome message if there is no conversation history yet
      if (formatted.length === 0) {
        formatted.push({
          id: `${sessionId}-welcome`,
          sender: 'jarvis',
          text: 'SYSTEM_BOOT: Local MCP Node active. All neural links air-gapped. How can I assist, Seth?',
        });
      }
      setMessages(formatted);
    } catch (err) {
      console.error(`[useChatSessions] Failed to load history for session ${sessionId}:`, err);
      setMessages([
        {
          id: 'error',
          sender: 'jarvis',
          text: `SYSTEM_ERROR: Failed to load conversation logs — ${err}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Switch to an existing session
  const switchSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    await loadHistory(sessionId);
  }, [loadHistory]);

  // Prepares a clean client-side draft session (does not commit to database yet)
  const createNewSession = useCallback(async () => {
    setActiveSessionId(null);
    setMessages([
      {
        id: 'draft-welcome',
        sender: 'jarvis',
        text: 'SYSTEM_BOOT: Local MCP Node active. All neural links air-gapped. How can I assist, Seth?',
      },
    ]);
    return null;
  }, []);

  // Initialize and load sessions on first mount
  useEffect(() => {
    const initialize = async () => {
      const list = await loadSessions();
      if (list.length > 0) {
        // Auto-select the most recently active session
        const latest = list[0];
        setActiveSessionId(latest.id);
        await loadHistory(latest.id);
      } else {
        // Start in draft mode
        await createNewSession();
      }
    };
    initialize();
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    setMessages,
    isLoading,
    loadSessions,
    switchSession,
    createNewSession,
  };
};
