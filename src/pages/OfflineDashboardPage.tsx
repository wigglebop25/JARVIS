import React, { useState } from 'react';
import { OfflineChatHistory, Message } from '@/features/mcp/components/offline/OfflineChatHistory';
import { OfflinePromptBar } from '@/features/mcp/components/offline/OfflinePromptBar';
import { MCPLoading } from '@/features/mcp/components/MCPLoading';
import { getRandomMcpResponse } from '@/lib/mcpMockData';

export const OfflineDashboardPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'jarvis', text: 'SYSTEM_BOOT: Local MCP Node active. All neural links air-gapped. How can I assist, Seth?' }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentQuery = input.toLowerCase();
    setInput("");

    setIsThinking(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    let responseText = getRandomMcpResponse();
    
    if (currentQuery.includes("status")) responseText = "CORE_STATUS: All local nodes operational. Network latency < 1ms.";
    if (currentQuery.includes("who")) responseText = "IDENTITY_AUTH: Seth A. Pinca. Level 5 Administrative Access granted.";

    const botMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      sender: 'jarvis', 
      text: responseText 
    };

    setMessages(prev => [...prev, botMsg]);
    setIsThinking(false);
  };

  return (
    <div className="h-full w-full flex flex-col bg-offline-surface relative overflow-hidden">
      
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `radial-gradient(var(--color-offline-core) 1px, transparent 1px)`,
          backgroundSize: '32px 32px' 
        }} 
      />
      
      <div className="scanline-overlay pointer-events-none" />
      
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