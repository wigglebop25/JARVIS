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
              className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Profile Icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
                msg.sender === 'user' 
                  ? 'border-white/10 bg-white/5 text-secondary-txt/80' 
                  : 'border-offline-border bg-offline-surface-dark text-offline-core shadow-[0_0_10px_rgba(var(--color-offline-core-rgb),0.1)]'
              }`}>
                {msg.sender === 'user' ? <User size={16} /> : <Cpu size={16} />}
              </div>

              {/* Chat Card Box */}
              <div className="flex flex-col gap-1 max-w-3xl">
                <div className={`
                  border rounded-xl p-4 font-sans text-[14px] leading-relaxed whitespace-pre-wrap selectable-text shadow-lg hover:shadow-xl transition-all duration-300
                  ${msg.sender === 'user' 
                    ? 'border-offline-border/50 bg-offline-surface/40 text-secondary-txt/90' 
                    : 'border-offline-border bg-offline-surface text-primary-txt border-l-2 border-l-offline-core'
                  }
                `}>
                  {/* Technical Header inside bubble */}
                  <div className="flex items-center justify-between gap-10 mb-2 border-b border-white/5 pb-1 select-none">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.15em] font-bold ${
                      msg.sender === 'user' ? 'text-secondary-txt/45' : 'text-offline-core/70'
                    }`}>
                      {msg.sender === 'user' ? '[AUTHORIZED_USER // SECURE_NODE]' : '[JARVIS_CORE // AIR_GAPPED_STANDBY]'}
                    </span>
                    <span className="font-mono text-[9px] text-white/20 font-bold">
                      SYS_OK
                    </span>
                  </div>
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