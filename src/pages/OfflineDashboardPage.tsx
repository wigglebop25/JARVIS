import { OfflineChatHistory } from '@/features/offline/components/OfflineChatHistory';
import { OfflinePromptBar } from '@/features/offline/components/OfflinePromptBar';
import { OfflineLoading } from '@/features/offline/components/OfflineLoading';
import { OfflineTelemetryHUD } from '@/features/offline/components/OfflineTelemetryHUD';
import { useSession } from '@/context/SessionContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Sparkles, MessageSquare, Terminal } from 'lucide-react';
import JarvisIcon from '@/assets/jarvislogofinal.svg';

/** Format a timestamp into a relative label */
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
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

export const OfflineDashboardPage = () => {
  const { messages, isThinking, input, setInput, sendMessage, sessions, activeSessionId, switchSession } = useSession();
  const [isHudOpen, setIsHudOpen] = useState(false);

  // Check if current session has any user prompts
  const hasUserMessages = messages.some(m => m.sender === 'user');

  // Filter 3 most recent sessions (excluding the current session if it is selected)
  const recentSessions = sessions
    .filter(s => s.id !== activeSessionId)
    .slice(0, 3);

  return (
    <div className="h-full w-full flex bg-offline-bg relative overflow-hidden">
      
      {/* ── LEFT: Terminal Chat Workspace ── */}
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        
        {/* Chat history section - animate in when user messages are present */}
        <AnimatePresence initial={false}>
          {hasUserMessages && (
            <motion.div 
              key="chat-history-container"
              initial={{ opacity: 0, height: 0, flexGrow: 0 }}
              animate={{ opacity: 1, height: "auto", flexGrow: 1 }}
              exit={{ opacity: 0, height: 0, flexGrow: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-offline-border/30"
            >
              <OfflineChatHistory messages={messages} />
              
              <div className="max-w-5xl mx-auto w-full px-4">
                 {isThinking && <OfflineLoading />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lower/Centered Input section - transitions layout dynamically */}
        <motion.div 
          layout
          transition={{ type: "spring", stiffness: 220, damping: 25 }}
          className={`flex flex-col items-center w-full px-6 transition-all duration-500
            ${hasUserMessages 
              ? 'py-3 justify-end bg-gradient-to-t from-offline-bg via-offline-bg/95 to-transparent' 
              : 'flex-1 justify-center py-12 overflow-y-auto custom-scrollbar'
            }`}
        >
          {/* Logo & Branding - only visible when no user messages */}
          <AnimatePresence>
            {!hasUserMessages && (
              <motion.div 
                key="branding-header"
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -25, scale: 0.9, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex flex-col items-center mb-8 text-center select-none shrink-0 pt-8"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-offline-core/10 rounded-full blur-xl animate-pulse" />
                  <motion.img 
                    src={JarvisIcon}
                    alt="Jarvis Logo" 
                    className="relative w-24 h-24 object-contain grayscale brightness-125"
                    animate={{ 
                      scale: [1, 1.04, 1],
                      opacity: [0.85, 1, 0.85]
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </div>
                <h1 className="text-2xl font-bold tracking-[0.15em] font-mono text-primary-txt uppercase">
                  JARVIS<span className="text-offline-core font-extrabold">//</span>LOCAL
                </h1>
                <p className="text-secondary-txt/50 font-mono text-[10px] uppercase tracking-[0.2em] mt-1.5">
                  Secure Air-Gapped AI Interface
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unified Prompt input */}
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 220, damping: 25 }}
            className={`w-full transition-all duration-500 ${hasUserMessages ? 'max-w-5xl' : 'max-w-2xl mb-8'}`}
          >
            <OfflinePromptBar 
              input={input} 
              setInput={setInput} 
              onSend={sendMessage} 
              disabled={isThinking}
              centered={!hasUserMessages}
            />
          </motion.div>

          {/* Bottom Section: Recent Chat Logs or Suggested Prompts */}
          <AnimatePresence>
            {!hasUserMessages && (
              <motion.div
                key="bottom-suggestions"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15, height: 0, marginTop: 0 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="w-full max-w-2xl overflow-hidden shrink-0"
              >
                {recentSessions.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 mb-3.5 px-1 select-none">
                      <Clock size={12} className="text-offline-core/55" />
                      <span className="text-[10px] font-mono text-secondary-txt/45 uppercase tracking-[0.2em] font-semibold">
                        Recent Chat Logs
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {recentSessions.map((session) => {
                        const title = session.title || 'Untitled Session';
                        const displayTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;
                        return (
                          <button
                            key={session.id}
                            onClick={() => switchSession(session.id)}
                            className="flex flex-col text-left p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-offline-core/5 hover:border-offline-core/20 hover:shadow-[0_0_15px_rgba(244,244,245,0.02)] transition-all duration-300 group cursor-pointer outline-none"
                          >
                            <div className="flex items-center gap-2 mb-1.5 text-secondary-txt/30 group-hover:text-offline-core/60 transition-colors">
                              <MessageSquare size={11} />
                              <span className="text-[8px] font-mono uppercase tracking-wider font-bold">
                                {formatRelativeTime(session.updated_at)}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-secondary-txt/80 group-hover:text-white truncate">
                              {displayTitle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-3.5 px-1 select-none">
                      <Sparkles size={12} className="text-offline-core/55" />
                      <span className="text-[10px] font-mono text-secondary-txt/45 uppercase tracking-[0.2em] font-semibold">
                        Suggested Prompts
                      </span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { prompt: "/status", label: "System Status", desc: "Run node diagnostics & diagnostics metrics" },
                        { prompt: "Show system metrics", label: "Analyze Metrics", desc: "View detailed CPU, RAM & disk specs" },
                        { prompt: "Explain device controls", label: "Device Guide", desc: "Learn wifi, bluetooth & recording commands" }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setInput(item.prompt)}
                          className="flex flex-col text-left p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-offline-core/5 hover:border-offline-core/20 hover:shadow-[0_0_15px_rgba(244,244,245,0.02)] transition-all duration-300 group cursor-pointer outline-none"
                        >
                          <div className="flex items-center gap-2 mb-1 text-offline-core/50 group-hover:text-offline-core transition-colors">
                            <Terminal size={11} />
                            <span className="text-[8px] font-mono uppercase tracking-wider font-bold">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-secondary-txt/90 group-hover:text-white font-bold mb-1">
                            {item.prompt}
                          </span>
                          <span className="text-[9px] font-sans text-secondary-txt/40 leading-snug">
                            {item.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── RIGHT: Collapsible Telemetry HUD ── */}
      <div className="relative z-20 h-full flex">
        <OfflineTelemetryHUD 
          isOpen={isHudOpen} 
          onToggle={() => setIsHudOpen(!isHudOpen)} 
        />
      </div>
    </div>
  );
};