import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JarvisIcon from '@/assets/jarvislogofinal.svg';
import { Settings, ChevronFirst, ChevronLast, Terminal } from 'lucide-react';

interface OfflineSidebarProps {
  onSettingsClick: () => void;
}

export const OfflineSidebar = ({ onSettingsClick }: OfflineSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? "16rem" : "4rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-offline-bg/80 backdrop-blur-xl border-r border-offline-border/95 flex flex-col z-40 relative shrink-0"
    >
      {/* HEADER: Unified Logo & Text Logic */}
      <div 
        data-tauri-drag-region 
        className="h-14 flex items-center border-b border-white/5 relative px-2"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <img 
            src={JarvisIcon}
            alt="Jarvis Logo" 
            className="ml-[1px] w-10 h-10 object-contain grayscale brightness-125" 
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

      {/* NAVIGATION: Local Protocols Only */}
      <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-hidden">
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
      </nav>

      {/* BOTTOM SECTION: Full-width Settings Button */}
      <div className="mt-auto flex flex-col pb-2 px-2 gap-2 border-t border-white/5 pt-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            onSettingsClick(); // This triggers the modal in the parent
          }}
          className="w-full flex items-center h-12 rounded-md transition-all duration-200 overflow-hidden group text-secondary-txt border border-transparent hover:bg-white/5 hover:text-primary-txt"
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