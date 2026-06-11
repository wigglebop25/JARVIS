import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JarvisIcon from '@/assets/jarvislogofinal.svg';
import { Settings, ChevronFirst, ChevronLast, Terminal, Plus, MessageSquare, Edit2, Trash2, Check, X, Database } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatRelativeTime } from '@/utils/time';

interface OfflineSidebarProps {
  onSettingsClick: () => void;
}

export const OfflineSidebar = ({ onSettingsClick }: OfflineSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { sessions, activeSessionId, createNewSession, switchSession, renameSession, deleteSession } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const isTerminalActive = location.pathname === '/';
  const isRagActive = location.pathname === '/rag';

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const startEdit = (sessionId: string, currentTitle: string) => {
    setDeletingSessionId(null);
    setEditingSessionId(sessionId);
    setEditTitle(currentTitle);
  };

  const handleSave = async (sessionId: string) => {
    if (!editTitle.trim()) {
      setEditingSessionId(null);
      return;
    }
    await renameSession(sessionId, editTitle.trim());
    setEditingSessionId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSave(sessionId);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

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

      {/* NAVIGATION */}
      <div className="py-3 px-2 flex flex-col gap-1 border-b border-white/5 mb-3 shrink-0">
        {/* Local Terminal Button */}
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center h-10 rounded-md transition-all duration-200 group cursor-pointer outline-none
            ${isTerminalActive 
              ? 'bg-offline-core/10 text-offline-core border border-offline-core/30 shadow-[inset_2px_0_0_var(--color-offline-core)] font-bold' 
              : 'text-secondary-txt/70 border border-transparent hover:bg-white/[0.03] hover:text-secondary-txt hover:border-white/5'
            }
          `}
          title={!isOpen ? "Local Terminal" : ""}
        >
          <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
            <Terminal size={18} />
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                className="font-mono text-xs whitespace-nowrap overflow-hidden"
              >
                Local_Terminal
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Knowledge Core Button */}
        <button
          onClick={() => navigate('/rag')}
          className={`w-full flex items-center h-10 rounded-md transition-all duration-200 group cursor-pointer outline-none
            ${isRagActive 
              ? 'bg-offline-core/10 text-offline-core border border-offline-core/30 shadow-[inset_2px_0_0_var(--color-offline-core)] font-bold' 
              : 'text-secondary-txt/70 border border-transparent hover:bg-white/[0.03] hover:text-secondary-txt hover:border-white/5'
            }
          `}
          title={!isOpen ? "Knowledge Core" : ""}
        >
          <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
            <Database size={18} />
          </div>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                className="font-mono text-xs whitespace-nowrap overflow-hidden"
              >
                Knowledge_Core
              </motion.div>
            )}
          </AnimatePresence>
        </button>
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
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.03 }}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (editingSessionId !== session.id) {
                      switchSession(session.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (editingSessionId !== session.id) {
                        switchSession(session.id);
                      }
                    }
                  }}
                  className={`w-full flex items-center rounded-md transition-all duration-200 overflow-hidden group cursor-pointer outline-none
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
                        className="flex-1 min-w-0 pr-3 flex items-center justify-between"
                      >
                        {editingSessionId === session.id ? (
                          <div className="flex-1 flex items-center min-w-0 pr-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              className="w-full bg-white/5 border border-offline-core/50 rounded px-1.5 py-0.5 text-[11px] font-mono text-offline-core outline-none min-w-0"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, session.id)}
                              onBlur={() => handleSave(session.id)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0 text-left pr-2">
                              <div className={`text-[11px] font-mono truncate leading-tight ${isActive ? 'text-offline-core' : 'text-secondary-txt/80'}`}>
                                {displayTitle}
                              </div>
                              <div className="text-[9px] font-mono text-secondary-txt/30 mt-0.5">
                                {formatRelativeTime(session.updated_at)}
                              </div>
                            </div>
                            
                            {/* Actions on Hover / Confirm Delete */}
                            <div 
                              className={`${deletingSessionId === session.id ? 'flex animate-pulse' : 'hidden group-hover:flex'} items-center gap-1 shrink-0`} 
                              onClick={(e) => e.stopPropagation()}
                            >
                              {deletingSessionId === session.id ? (
                                <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 rounded px-1 py-0.5">
                                  <button
                                    onClick={() => {
                                      deleteSession(session.id);
                                      setDeletingSessionId(null);
                                    }}
                                    className="text-red-500 hover:text-red-400 p-0.5 transition-colors rounded hover:bg-white/5 cursor-pointer"
                                    title="Confirm Delete"
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingSessionId(null)}
                                    className="text-secondary-txt/40 hover:text-white p-0.5 transition-colors rounded hover:bg-white/5 cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(session.id, title)}
                                    className="text-secondary-txt/40 hover:text-offline-core p-1 transition-colors rounded hover:bg-white/5 cursor-pointer"
                                    title="Rename Session"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    onClick={() => setDeletingSessionId(session.id)}
                                    className="text-secondary-txt/40 hover:text-red-500/80 p-1 transition-colors rounded hover:bg-white/5 cursor-pointer"
                                    title="Delete Session"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </>
                              )}
                            </div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
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