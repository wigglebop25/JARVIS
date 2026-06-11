import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ChevronDown, X } from 'lucide-react';
import { Message } from '../types';
import MessageItem from './MessageItem';
import { OfflineLoading } from '@/features/offline/components/OfflineLoading';

interface MessageLogProps {
  messages: Message[];
  isThinking?: boolean;
  onClose?: () => void;
  theme: 'online' | 'offline';
  variant?: 'overlay' | 'inline';
}

export const MessageLog = ({ messages, isThinking = false, onClose, theme, variant = 'overlay' }: MessageLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollButton(isFarFromBottom);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (variant === 'inline') {
    return (
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar px-4 py-8 space-y-10"
        >
          <div className="max-w-5xl mx-auto w-full flex flex-col gap-10">
            {messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} theme={theme} />
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
              className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 border rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-colors ${
                theme === 'online'
                  ? 'bg-theme-surface-1 border-theme-border hover:border-theme-accent'
                  : 'bg-offline-surface border-offline-border hover:border-offline-core'
              }`}
            >
              <span className={`text-[9px] font-mono tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100 ${
                theme === 'online' ? 'text-theme-accent' : 'text-offline-core'
              }`}>
                Return_To_Latest
              </span>
              <ChevronDown size={14} className={`animate-bounce ${theme === 'online' ? 'text-theme-accent' : 'text-offline-core'}`} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (messages.length === 0 && !isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`w-full max-w-5xl mb-4 backdrop-blur-2xl border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto ${
        theme === 'online' ? 'bg-theme-surface-1 border-theme-border' : 'bg-offline-surface border-offline-border'
      }`}
      style={{ maxHeight: '65vh' }}
    >
      <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${theme === 'online' ? 'bg-theme-accent' : 'bg-offline-core'}`} />
          <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${theme === 'online' ? 'text-theme-accent' : 'text-offline-core'}`}>Uplink_History</span>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-secondary-txt hover:text-white transition-colors cursor-pointer"
            title="Hide History"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col gap-6"
      >
        {messages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} theme={theme} />
        ))}

        <AnimatePresence>
          {isThinking && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex gap-4 max-w-[85%]"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border shadow-[0_0_10px_rgba(var(--${
                theme === 'online' ? 'theme-accent-rgb' : 'color-offline-core-rgb'
              }),0.15)] ${
                theme === 'online'
                  ? 'border-theme-accent/20 bg-theme-surface-2 text-theme-accent'
                  : 'border-offline-border bg-offline-surface-dark text-offline-core'
              }`}>
                <Cpu size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              <div className="flex flex-col gap-1 flex-1">
                <div className={`border rounded-xl p-4 font-sans text-[14px] leading-relaxed shadow-lg border-l-2 ${
                  theme === 'online'
                    ? 'border-theme-border bg-theme-surface-1/40 border-l-theme-accent'
                    : 'border-offline-border bg-offline-surface/40 border-l-offline-core'
                }`}>
                  <div className="flex items-center justify-between gap-10 mb-2 border-b border-white/5 pb-1 select-none">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.15em] font-bold ${theme === 'online' ? 'text-theme-accent/70' : 'text-offline-core/70'}`}>
                      [JARVIS_CORE // THINKING]
                    </span>
                    <span className={`font-mono text-[9px] animate-pulse font-bold ${theme === 'online' ? 'text-theme-accent/40' : 'text-offline-core/40'}`}>
                      PROCESSING
                    </span>
                  </div>
                  <OfflineLoading theme={theme} compact={true} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} className="h-4" />
      </div>
    </motion.div>
  );
};
