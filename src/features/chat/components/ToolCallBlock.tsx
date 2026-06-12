import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import type { MessagePart } from '../types';

interface ToolCallBlockProps {
  toolCall: Extract<MessagePart, { kind: 'tool_call' }>;
  theme: 'online' | 'offline';
  isStreaming?: boolean;
}

export const ToolCallBlock = ({ toolCall, theme, isStreaming = false }: ToolCallBlockProps) => {
  const [isOpen, setIsOpen] = useState(isStreaming);

  const accentClass = theme === 'online' ? 'text-theme-accent' : 'text-offline-core';
  const borderClass = theme === 'online' ? 'border-theme-border' : 'border-offline-border';
  const bgClass = theme === 'online' ? 'bg-theme-surface-2' : 'bg-offline-surface-dark';

  return (
    <div className={`border ${borderClass}/30 ${bgClass}/30 rounded-lg overflow-hidden text-[12px] my-2`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 ${bgClass}/20 ${accentClass}/60 hover:${accentClass} select-none font-mono text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer`}
      >
        <Wrench size={10} className="shrink-0" />
        <span className="truncate">{toolCall.name}</span>
        {isStreaming && (
          <span className={`ml-1 inline-block w-1.5 h-3 ${accentClass}/80 animate-pulse`} />
        )}
        <span className="ml-auto text-white/20">
          {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && toolCall.args && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="px-3 py-2 font-mono text-[10px] text-secondary-txt/50 bg-black/10 border-t border-white/5 overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto"
          >
            {toolCall.args}
            {isStreaming && (
              <span className={`inline-block w-1.5 h-3 ${accentClass}/80 ml-1 animate-pulse`} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
