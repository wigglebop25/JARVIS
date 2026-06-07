import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, User, ChevronDown, ChevronRight, FileText, Brain } from 'lucide-react';
import { Message } from '@/context/SessionContext';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { parseThinking, estimateTokens } from '@/utils/chatUtils';

interface OfflineMessageItemProps {
  msg: Message;
}

const CollapsibleThinkingBlock = ({ thinking, isDone }: { thinking: string; isDone: boolean }) => {
  const [isOpen, setIsOpen] = useState(!isDone);

  useEffect(() => {
    if (!isDone) {
      setIsOpen(true);
    }
  }, [isDone]);

  return (
    <div className="border border-offline-border/40 bg-offline-surface/10 rounded-lg my-2 overflow-hidden text-[13px]">
      <button
        onClick={() => isDone && setIsOpen(!isOpen)}
        disabled={!isDone}
        className={`w-full flex items-center justify-between px-3 py-2 bg-offline-surface/30 text-offline-core/70 hover:text-offline-core select-none font-mono text-[10px] uppercase tracking-wider font-semibold border-b border-offline-border/20 transition-colors ${isDone ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <Brain size={12} className={!isDone ? "animate-pulse text-offline-core" : "text-offline-core/55"} />
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
            className="p-3 font-mono text-xs text-secondary-txt/65 bg-black/20 overflow-x-auto whitespace-pre-wrap leading-relaxed border-t border-white/5"
          >
            {thinking}
            {!isDone && (
              <span className="inline-block w-1.5 h-3 bg-offline-core/80 ml-1 animate-pulse" />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OfflineMessageItem = memo(({ msg }: OfflineMessageItemProps) => {
  return (
    <motion.div 
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

      {/* Chat Box */}
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
            <div className="flex items-center gap-2 font-mono text-[9px] text-white/20 font-bold">
              <span className="text-secondary-txt/40 mr-1 border border-white/5 px-1 py-0.5 rounded bg-white/[0.02]">
                {msg.tokenCount !== undefined 
                  ? `${msg.tokenCount} TOKENS` 
                  : `${estimateTokens(msg.text)} TOKENS (EST)`}
              </span>
              SYS_OK
            </div>
          </div>
          {(() => {
            const lines = msg.text.split('\n');
            const attachmentPaths: string[] = [];
            const contentLines: string[] = [];

            for (const line of lines) {
              const match = line.match(/^\[Attached:\s*(.+)\]$/);
              if (match) {
                attachmentPaths.push(match[1]);
              } else {
                contentLines.push(line);
              }
            }

            const cleanText = contentLines.join('\n').trim();

            if (msg.sender === 'jarvis') {
              const parsed = parseThinking(cleanText);
              return (
                <div className="flex flex-col gap-2">
                  {parsed.hasThinking && parsed.thinking && (
                    <CollapsibleThinkingBlock 
                      thinking={parsed.thinking} 
                      isDone={parsed.isThinkingDone} 
                    />
                  )}
                  {parsed.content && <MarkdownRenderer content={parsed.content} theme="offline" />}
                </div>
              );
            }

            return (
              <div className="flex flex-col gap-2">
                {attachmentPaths.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {attachmentPaths.map((path, idx) => {
                      const fileName = path.split(/[/\\]/).pop() || path;
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-secondary-txt"
                          title={path}
                        >
                          <FileText size={10} />
                          <span>{fileName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {cleanText && <MarkdownRenderer content={cleanText} theme="offline" />}
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return prevProps.msg.id === nextProps.msg.id && prevProps.msg.text === nextProps.msg.text;
});

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
            <OfflineMessageItem key={msg.id} msg={msg} />
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