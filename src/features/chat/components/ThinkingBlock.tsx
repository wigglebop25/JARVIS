import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkingBlockProps {
  thinking: string;
  isDone: boolean;
  theme: 'online' | 'offline';
}

export const ThinkingBlock = ({ thinking, isDone, theme }: ThinkingBlockProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const accentClass = theme === 'online' ? 'text-theme-accent' : 'text-offline-core';
  const borderClass = theme === 'online' ? 'border-theme-border' : 'border-offline-border';
  const bgClass = theme === 'online' ? 'bg-theme-surface-2' : 'bg-offline-surface-dark';

  return (
    <div className={`border ${borderClass}/30 ${bgClass}/30 rounded-lg overflow-hidden text-[12px] my-2`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 ${bgClass}/20 ${accentClass}/60 hover:${accentClass} select-none font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer`}
      >
        <Brain size={10} className={`shrink-0 ${!isDone ? `animate-pulse ${accentClass}` : `${accentClass}/50`}`} />
        <span className="truncate">{isDone ? 'Thinking Process' : 'JARVIS is thinking...'}</span>
        {!isDone && (
          <span className={`ml-1 inline-block w-1.5 h-3 ${accentClass}/80 animate-pulse`} />
        )}
        <span className="ml-auto text-white/20">
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="px-3 py-2 font-mono text-[10px] text-secondary-txt/50 bg-black/10 border-t border-white/5 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto"
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
