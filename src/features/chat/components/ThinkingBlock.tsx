import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkingBlockProps {
  thinking: string;
  isDone: boolean;
  theme: 'online' | 'offline';
}

export const ThinkingBlock = ({ thinking, isDone, theme }: ThinkingBlockProps) => {
  const [isOpen, setIsOpen] = useState(!isDone);

  useEffect(() => {
    if (!isDone) {
      setIsOpen(true);
    }
  }, [isDone]);

  const accentClass = theme === 'online' ? 'text-theme-accent' : 'text-offline-core';
  const borderClass = theme === 'online' ? 'border-theme-border' : 'border-offline-border';
  const surfaceClass = theme === 'online' ? 'bg-theme-surface-2' : 'bg-offline-surface';

  return (
    <div className={`border ${borderClass}/40 ${surfaceClass}/10 rounded-lg my-2 overflow-hidden text-[13px]`}>
      <button
        onClick={() => isDone && setIsOpen(!isOpen)}
        disabled={!isDone}
        className={`w-full flex items-center justify-between px-3 py-2 ${surfaceClass}/30 ${accentClass}/70 hover:${accentClass} select-none font-mono text-[10px] uppercase tracking-wider font-semibold border-b ${borderClass}/20 transition-colors ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <Brain size={12} className={!isDone ? `animate-pulse ${accentClass}` : `${accentClass}/50`} />
          <span>{isDone ? 'Thinking Process' : 'JARVIS is thinking...'}</span>
        </div>
        {isDone && (isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-3 font-mono text-xs text-secondary-txt/65 bg-black/15 overflow-x-auto whitespace-pre-wrap leading-relaxed border-t border-white/5"
          >
            {thinking}
            {!isDone && (
              <span className={`inline-block w-1.5 h-3 ${accentClass}/80 ml-1 animate-pulse`} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
