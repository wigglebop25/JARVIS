import React, { useState } from 'react';
import { OfflineChatHistory, Message } from '@/features/mcp/components/offline/OfflineChatHistory';
import { OfflinePromptBar } from '@/features/mcp/components/offline/OfflinePromptBar';

export const OfflineDashboardPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'jarvis', text: 'System standing by in Offline Mode. Neural link encrypted.' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Here you would call your Rust/Tauri backend for the MCP response
    setTimeout(() => {
      const botMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        sender: 'jarvis', 
        text: 'Query received. Executing local protocol...' 
      };
      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  return (
    <div className="h-full w-full flex flex-col bg-base relative overflow-hidden">
      {/* Background Technical Scanlines */}
      <div className="scanline-overlay" />
      
      {/* Full Width Chat Log */}
      <OfflineChatHistory messages={messages} />

      {/* Full Width Input Bar */}
      <OfflinePromptBar 
        input={input} 
        setInput={setInput} 
        onSend={handleSend} 
      />
    </div>
  );
};