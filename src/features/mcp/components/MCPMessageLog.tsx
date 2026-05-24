import { useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, User, FileText, X } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { MCPLoading } from '@/features/mcp/components/MCPLoading';

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
}

interface MCPMessageLogProps {
  messages: Message[];
  isThinking?: boolean;
  onClose?: () => void;
}

interface OnlineMessageItemProps {
  msg: Message;
}

const OnlineMessageItem = memo(({ msg }: OnlineMessageItemProps) => {
  return (
    <motion.div 
      key={msg.id} 
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className={`flex gap-4 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
        msg.sender === 'user' 
          ? 'border-white/10 bg-white/5 text-secondary-txt/80' 
          : 'border-theme-border bg-theme-surface-2 text-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.1)]'
      }`}>
        {msg.sender === 'user' ? <User size={16} /> : <Cpu size={16} />}
      </div>
      
      {/* Message Bubble */}
      <div className="flex flex-col gap-1 flex-1">
        <div className={`
          border rounded-xl p-4 font-sans text-[14px] leading-relaxed whitespace-pre-wrap selectable-text shadow-lg hover:shadow-xl transition-all duration-300
          ${msg.sender === 'user' 
            ? 'border-white/5 bg-white/[0.03] text-secondary-txt/90' 
            : 'border-theme-border bg-theme-surface-1/40 text-primary-txt border-l-2 border-l-theme-accent'
          }
        `}>
          {/* Technical Header inside bubble */}
          <div className="flex items-center justify-between gap-10 mb-2 border-b border-white/5 pb-1 select-none">
            <span className={`font-mono text-[9px] uppercase tracking-[0.15em] font-bold ${
              msg.sender === 'user' ? 'text-secondary-txt/45' : 'text-theme-accent/70'
            }`}>
              {msg.sender === 'user' ? '[AUTHORIZED_USER // SECURE_NODE]' : '[JARVIS_CORE // UPLINK_ONLINE]'}
            </span>
            <span className="font-mono text-[9px] text-white/20 font-bold">
              SYS_OK
            </span>
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
                {cleanText && <MarkdownRenderer content={cleanText} theme="online" />}
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

export const MCPMessageLog = ({ messages, isThinking = false }: MCPMessageLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive or thinking status changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (messages.length === 0 && !isThinking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      // Sits right above the prompt bar, full width up to max-5xl
      className="w-full max-w-5xl mb-4 bg-theme-surface-1 backdrop-blur-2xl border border-theme-border rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col pointer-events-auto"
      style={{ maxHeight: '65vh' }}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/5 flex justify-between items-center bg-black/20 select-none">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
          <span className="text-[10px] font-mono text-theme-accent uppercase tracking-widest font-bold">Uplink_History</span>
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

      {/* Message List */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col gap-6"
      >
        {messages.map((msg) => (
          <OnlineMessageItem key={msg.id} msg={msg} />
        ))}

        {/* THINKING STATE BUBBLE */}
        <AnimatePresence>
          {isThinking && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex gap-4 max-w-[85%]"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-theme-accent/20 bg-theme-surface-2 text-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.15)]">
                <Cpu size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
              </div>
              
              {/* Message Bubble */}
              <div className="flex flex-col gap-1 flex-1">
                <div className="border border-theme-border bg-theme-surface-1/40 rounded-xl p-4 font-sans text-[14px] leading-relaxed shadow-lg border-l-2 border-l-theme-accent">
                  {/* Technical Header */}
                  <div className="flex items-center justify-between gap-10 mb-2 border-b border-white/5 pb-1 select-none">
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] font-bold text-theme-accent/70">
                      [JARVIS_CORE // THINKING]
                    </span>
                    <span className="font-mono text-[9px] text-theme-accent/40 animate-pulse font-bold">
                      PROCESSING
                    </span>
                  </div>
                  <MCPLoading theme="online" compact={true} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invisible div to scroll to */}
        <div ref={bottomRef} className="h-4" />
      </div>
    </motion.div>
  );
};