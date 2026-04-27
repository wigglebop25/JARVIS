import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, User, ChevronDown } from 'lucide-react';

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
}

export const OfflineChatHistory = ({ messages }: { messages: Message[] }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollButton(isFarFromBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 space-y-10"
      >
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
          {messages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-6 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
                msg.sender === 'user' 
                  ? 'border-white/10 bg-white/5 text-secondary-txt' 
                  : 'border-offline-core/30 bg-offline-core/10 text-offline-core shadow-[0_0_15px_var(--color-offline-border)]'
              }`}>
                {msg.sender === 'user' ? <User size={20} /> : <Cpu size={20} />}
              </div>

              <div className={`flex flex-col gap-2 max-w-3xl ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-30 select-none">
                  {msg.sender === 'user' ? 'Authorized_User' : 'Jarvis_Core'}
                </span>
                
                <div className={`
                  text-sm leading-relaxed font-mono whitespace-pre-wrap selectable-text p-1
                  ${msg.sender === 'user' 
                    ? 'text-right text-secondary-txt/80' 
                    : 'text-left text-primary-txt/90 selection:bg-offline-core/30'
                  }
                `}>
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-offline-surface border border-offline-border rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] group hover:border-offline-core transition-colors"
          >
            <span className="text-[9px] font-mono text-offline-core tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100">
              Return_To_Latest
            </span>
            <ChevronDown size={14} className="text-offline-core animate-bounce" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};