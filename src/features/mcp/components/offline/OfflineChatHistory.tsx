import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, User } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
}

export const OfflineChatHistory = ({ messages }: { messages: Message[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 space-y-10">
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
        {messages.map((msg) => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-6 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar - Using the Deep Cobalt variant */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
              msg.sender === 'user' 
                ? 'border-white/10 bg-white/5 text-secondary-txt' 
                : 'border-offline-core/30 bg-offline-core/10 text-offline-core shadow-[0_0_15px_rgba(14,165,233,0.1)]'
            }`}>
              {msg.sender === 'user' ? <User size={20} /> : <Cpu size={20} />}
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-2 max-w-3xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-30">
                {msg.sender === 'user' ? 'Authorized_User' : 'Jarvis_Core'}
              </span>
              <div className={`text-sm leading-relaxed font-mono whitespace-pre-wrap ${
                msg.sender === 'user' ? 'text-right text-secondary-txt' : 'text-left text-primary-txt/90'
              }`}>
                {msg.text}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};