import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JarvisIcon from '@/assets/jarvislogofinal.svg';
import { Settings, ChevronFirst, ChevronLast, Terminal, Plus, MessageSquare } from 'lucide-react';
import { useSession } from '@/context/SessionContext';

interface OfflineSidebarProps {
  onSettingsClick: () => void;
}

/** Format a timestamp into a relative label */
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  // Backend uses seconds, JS uses ms — normalize
  const ts = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export const OfflineSidebar = ({ onSettingsClick }: OfflineSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { sessions, activeSessionId, createNewSession, switchSession } = useSession();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? "16rem" : "4rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-offline-surface-dark border-r border-offline-border/80 flex flex-col z-40 relative shrink-0"
    >
      {/* HEADER: Unified Logo & Text Logic */}
      <div 
        data-tauri-drag-region 
        className="h-14 flex items-center border-b border-white/5 relative px-2"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <motion.img 
            src={JarvisIcon}
            alt="Jarvis Logo" 
            className="ml-[1px] w-10 h-10 object-contain grayscale brightness-125"
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }}
                className="font-mono text-primary-txt font-bold tracking-[0.2em] text-sm whitespace-nowrap"
              >
                JARVIS
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center text-secondary-txt hover:text-offline-core transition-all z-50
            ${isOpen 
              ? 'ml-auto w-8 h-8 rounded-md hover:bg-white/5 shrink-0' 
              : 'absolute -right-3 top-4 w-6 h-6 bg-offline-surface border border-offline-border/30 rounded-full shadow-md'
            }
          `}
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronFirst size={18} /> : <ChevronLast size={14} />}
        </button>
      </div>

      {/* NAVIGATION: Local Terminal Label */}
      <div className="py-3 px-2">
        <div className="flex items-center h-10 rounded-md bg-offline-core/10 text-offline-core border border-offline-core/30 shadow-[inset_2px_0_0_var(--color-offline-core)] group cursor-default">
          <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
            <Terminal size={20} />
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                className="font-mono text-sm whitespace-nowrap overflow-hidden"
              >
                Local_Terminal
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SESSION LIST */}
      <div className="flex-1 flex flex-col overflow-hidden px-2">
        {/* New Session Button */}
        <button
          onClick={createNewSession}
          className="flex items-center h-9 rounded-md transition-all duration-200 overflow-hidden group text-secondary-txt border border-dashed border-white/10 hover:border-offline-core/40 hover:bg-offline-core/5 hover:text-offline-core mb-2 shrink-0 cursor-pointer"
          title={!isOpen ? "New Session" : ""}
        >
          <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-90">
            <Plus size={16} />
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                className="font-mono text-[11px] whitespace-nowrap overflow-hidden uppercase tracking-wider"
              >
                New_Session
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Section Header */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex items-center gap-2 px-2 mb-2"
            >
              <span className="text-[9px] font-mono text-secondary-txt/40 uppercase tracking-[0.2em]">
                Session_Log
              </span>
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[9px] font-mono text-secondary-txt/30">
                {sessions.length}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Session List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
          <AnimatePresence mode="popLayout">
            {sessions.map((session, index) => {
              const isActive = session.id === activeSessionId;
              const title = session.title || 'Untitled Session';
              const displayTitle = title.length > 28 ? title.substring(0, 28) + '...' : title;

              return (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => switchSession(session.id)}
                  className={`w-full flex items-center rounded-md transition-all duration-200 overflow-hidden group cursor-pointer
                    ${isActive 
                      ? 'bg-offline-core/10 text-offline-core border border-offline-core/30 shadow-[inset_2px_0_0_var(--color-offline-core)]' 
                      : 'text-secondary-txt/70 border border-transparent hover:bg-white/[0.03] hover:text-secondary-txt hover:border-white/5'
                    }
                    ${isOpen ? 'h-auto py-2' : 'h-10'}
                  `}
                  title={!isOpen ? title : ""}
                >
                  <div className={`w-12 shrink-0 flex items-center justify-center transition-colors ${isActive ? 'text-offline-core' : 'text-secondary-txt/40 group-hover:text-secondary-txt/60'}`}>
                    <MessageSquare size={14} />
                  </div>
                  <AnimatePresence mode="wait">
                    {isOpen && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                        className="flex-1 min-w-0 pr-3"
                      >
                        <div className={`text-left text-[11px] font-mono truncate leading-tight ${isActive ? 'text-offline-core' : 'text-secondary-txt/80'}`}>
                          {displayTitle}
                        </div>
                        <div className="text-left text-[9px] font-mono text-secondary-txt/30 mt-0.5">
                          {formatRelativeTime(session.updated_at)}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* BOTTOM SECTION: Full-width Settings Button */}
      <div className="mt-auto flex flex-col pb-3 px-2 gap-2 border-t border-white/5 pt-3">
        <button
          onClick={(e) => {
            e.preventDefault();
            onSettingsClick(); // This triggers the modal in the parent
          }}
          className="w-full flex items-center h-12 rounded-lg transition-all duration-300 overflow-hidden group text-primary-txt/80 bg-white/[0.01] border border-offline-border/30 hover:border-offline-core/50 hover:bg-offline-core/5 hover:text-white hover:shadow-[0_0_15px_rgba(200,200,200,0.1)]"
          title={!isOpen ? "System Settings" : ""}
        >
          {/* Icon Section */}
          <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:rotate-45">
            <Settings size={20} />
          </div>
          
          {/* Label Section */}
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                className="font-mono text-sm whitespace-nowrap overflow-hidden" 
              >
                Settings
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* FOOTER: Secure Status */}
      <div className="h-12 flex items-center bg-transparent px-2">
        <div className="w-12 shrink-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-offline-core shadow-[0_0_8px_var(--color-offline-core)] animate-pulse"></div>
        </div>
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5, transition: { duration: 0.1 } }}
              className="font-mono text-[10px] text-offline-core uppercase tracking-wider whitespace-nowrap overflow-hidden"
            >
              Node.AirGapped
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};