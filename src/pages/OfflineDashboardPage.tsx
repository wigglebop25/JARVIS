import React, { useState, useEffect, useRef } from 'react';
import { OfflineChatHistory, Message } from '@/features/mcp/components/offline/OfflineChatHistory';
import { OfflinePromptBar } from '@/features/mcp/components/offline/OfflinePromptBar';
import { MCPLoading } from '@/features/mcp/components/MCPLoading';
import { sendPrompt, createSession } from '@/services/chatService';

export const OfflineDashboardPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'jarvis', text: 'SYSTEM_BOOT: Local MCP Node active. All neural links air-gapped. How can I assist, Seth?' }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionInitRef = useRef(false);

  // Initialize a backend session on mount
  useEffect(() => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;

    const initSession = async () => {
      try {
        const id = await createSession("Offline Session");
        setSessionId(id);
        console.log("[OfflineDashboard] Session created:", id);
      } catch (err) {
        console.warn("[OfflineDashboard] Backend session creation failed, chat will operate in degraded mode:", err);
      }
    };
    initSession();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");

    setIsThinking(true);

    let responseText: string;

    try {
      // Ensure we have a session
      let sid = sessionId;
      if (!sid) {
        sid = await createSession("Offline Session");
        setSessionId(sid);
      }

      const response = await sendPrompt(sid, currentInput);
      responseText = response.message;
    } catch (err) {
      console.error("[OfflineDashboard] Backend prompt failed:", err);
      responseText = `SYSTEM_ERROR: Backend unreachable — ${err}`;
    }

    const botMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      sender: 'jarvis', 
      text: responseText 
    };

    setMessages(prev => [...prev, botMsg]);
    setIsThinking(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-offline-bg relative overflow-hidden">
      
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        <OfflineChatHistory messages={messages} />
        
        <div className="max-w-5xl mx-auto w-full px-4">
           {isThinking && <MCPLoading />}
        </div>
      </div>

      <div className="w-full z-20 bg-gradient-to-t from-offline-bg via-offline-bg/90 to-transparent">
        <OfflinePromptBar 
          input={input} 
          setInput={setInput} 
          onSend={handleSend} 
          disabled={isThinking}
        />
      </div>
    </div>
  );
};