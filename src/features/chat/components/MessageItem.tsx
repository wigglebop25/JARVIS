import { memo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, User, FileText } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { estimateTokens } from '@/utils/chatUtils';
import { Message, getMessageText } from '../types';
import { areMessagesEqual } from '../messageUtils';
import { ThinkingBlock } from './ThinkingBlock';
import { ToolCallBlock } from './ToolCallBlock';

interface MessageItemProps {
  msg: Message;
  theme: 'online' | 'offline';
}

const MessageItem = memo(({ msg, theme }: MessageItemProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: theme === 'online' ? 12 : 10, scale: theme === 'online' ? 0.98 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-300 ${
        msg.sender === 'user' 
          ? 'border-white/10 bg-white/5 text-secondary-txt/80' 
          : theme === 'online'
            ? 'border-theme-border bg-theme-surface-2 text-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.15)]'
            : 'border-offline-border bg-offline-surface-dark text-offline-core shadow-[0_0_10px_rgba(var(--color-offline-core-rgb),0.1)]'
      }`}>
        {msg.sender === 'user' ? <User size={16} /> : <Cpu size={16} />}
      </div>
      
      <div className="flex flex-col gap-1 flex-1">
        <div className={`
          border rounded-xl p-4 font-sans text-[14px] leading-relaxed whitespace-pre-wrap selectable-text shadow-lg hover:shadow-xl transition-all duration-300
          ${msg.sender === 'user' 
            ? theme === 'online'
              ? 'border-white/5 bg-white/[0.03] text-secondary-txt/90'
              : 'border-offline-border/50 bg-offline-surface/40 text-secondary-txt/90'
            : theme === 'online'
              ? 'border-theme-border bg-theme-surface-1/40 text-primary-txt border-l-2 border-l-theme-accent'
              : 'border-offline-border bg-offline-surface text-primary-txt border-l-2 border-l-offline-core'
          }
        `}>
          <div className="flex items-center justify-between gap-10 mb-2 border-b border-white/5 pb-1 select-none">
            <span className={`font-mono text-[9px] uppercase tracking-[0.15em] font-bold ${
              msg.sender === 'user' ? 'text-secondary-txt/45' : theme === 'online' ? 'text-theme-accent/70' : 'text-offline-core/70'
            }`}>
              {msg.sender === 'user' ? '[AUTHORIZED_USER // SECURE_NODE]' : theme === 'online' ? '[JARVIS_CORE // UPLINK_ONLINE]' : '[JARVIS_CORE // AIR_GAPPED_STANDBY]'}
            </span>
            <div className="flex items-center gap-2 font-mono text-[9px] text-white/20 font-bold">
              <span className="text-secondary-txt/40 mr-1 border border-white/5 px-1 py-0.5 rounded bg-white/[0.02]">
                {msg.tokenCount !== undefined 
                  ? `${msg.tokenCount} TOKENS` 
                  : `${estimateTokens(getMessageText(msg))} TOKENS (EST)`}
              </span>
              SYS_OK
            </div>
          </div>

          {(() => {
            const fullText = getMessageText(msg);
            const lines = fullText.split('\n');
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

            if (msg.sender === 'jarvis') {
              return (
                <div className="flex flex-col gap-2">
                  {msg.parts.map((part, i) => {
                    if (part.kind === 'thinking') {
                      return (
                        <ThinkingBlock
                          key={`t-${i}`}
                          thinking={part.content}
                          isDone={part.isDone}
                          theme={theme}
                        />
                      );
                    }
                    if (part.kind === 'tool_call') {
                      return (
                        <ToolCallBlock
                          key={`tc-${i}-${part.id}`}
                          toolCall={part}
                          theme={theme}
                          isStreaming={!part.isDone}
                        />
                      );
                    }
                    return part.content ? (
                      <MarkdownRenderer key={`tx-${i}`} content={part.content} theme={theme} />
                    ) : null;
                  })}
                </div>
              );
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
                {cleanText && <MarkdownRenderer content={cleanText} theme={theme} />}
              </div>
            );
          })()}
        </div>
      </div>
    </motion.div>
  );
}, areMessagesEqual);

export default MessageItem;
