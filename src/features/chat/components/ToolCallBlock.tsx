import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { ToolCall } from '../types';

interface ToolCallBlockProps {
  toolCalls: ToolCall[];
  theme: 'online' | 'offline';
}

export const ToolCallBlock = ({ toolCalls, theme }: ToolCallBlockProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (toolCalls.length === 0) return null;

  const accentClass = theme === 'online' ? 'text-theme-accent' : 'text-offline-core';
  const borderClass = theme === 'online' ? 'border-theme-border' : 'border-offline-border';
  const bgClass = theme === 'online' ? 'bg-theme-surface-2' : 'bg-offline-surface-dark';

  return (
    <div className="my-2 space-y-1">
      {toolCalls.map((tc, idx) => (
        <div key={idx} className={`border ${borderClass}/30 ${bgClass}/30 rounded-lg overflow-hidden text-[12px]`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 ${bgClass}/20 ${accentClass}/60 hover:${accentClass} select-none font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer`}
          >
            <Wrench size={10} className="shrink-0" />
            <span className="truncate">{tc.name}</span>
            <span className="ml-auto text-white/20">
              {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </span>
          </button>
          <AnimatePresence initial={false}>
            {isOpen && tc.args && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="px-3 py-2 font-mono text-[10px] text-secondary-txt/50 bg-black/10 border-t border-white/5 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto"
              >
                {tc.args}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
