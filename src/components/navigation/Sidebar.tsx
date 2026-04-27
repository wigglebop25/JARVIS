import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JarvisIcon from '@/assets/jarvislogofinal.svg';
import { 
  Settings, 
  ChevronFirst, 
  ChevronLast 
} from 'lucide-react';
import { navigations } from '@/config/navigations';

interface SidebarProps {
  onSettingsClick: () => void;
}

export const Sidebar = ({ onSettingsClick }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(true); 
  const location = useLocation();

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? "16rem" : "4rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-surface-2/70 backdrop-blur-xl border-r border-white/5 flex flex-col z-40 relative shrink-0"
    >
      {/* HEADER */}
      <div 
        data-tauri-drag-region 
        className="h-14 flex items-center border-b border-surface-3/50 relative px-2"
      >
        <div className="flex items-center gap-3 pointer-events-none">
          <img 
            src={JarvisIcon}
            alt="Jarvis Logo" 
            className="ml-[1px] w-10 h-10 object-contain" 
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
          className={`flex items-center justify-center text-secondary-txt hover:text-jarvis-blue transition-all z-50
            ${isOpen 
              ? 'ml-auto w-8 h-8 rounded-md hover:bg-surface-1/50 shrink-0' 
              : 'absolute -right-3 top-4 w-6 h-6 bg-surface-2 border border-surface-3 rounded-full shadow-md'
            }
          `}
          title={isOpen ? "Collapse" : "Expand"}
        >
          {isOpen ? <ChevronFirst size={18} /> : <ChevronLast size={14} />}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-hidden">
        {navigations.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center h-10 rounded-md transition-all duration-200 overflow-hidden group
                ${isActive 
                  ? 'bg-jarvis-blue/10 text-jarvis-blue border border-jarvis-blue/30 shadow-[inset_2px_0_0_#00F0FF]' 
                  : 'text-secondary-txt border border-transparent hover:bg-surface-1/50 hover:text-primary-txt'
                }
              `}
              title={!isOpen ? item.name : ""}
            >
              <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                {item.icon}
              </div>
              <AnimatePresence mode="wait">
                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, width: 0, transition: { duration: 0.1 } }}
                    transition={{ delay: index * 0.05 }} 
                    className="font-mono text-sm whitespace-nowrap overflow-hidden"
                  >
                    {item.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* SETTINGS */}
      <div className="mt-auto flex flex-col pb-2 px-2 gap-2 border-t border-white/5 pt-2">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center h-10 rounded-md transition-all duration-200 overflow-hidden group text-secondary-txt border border-transparent hover:bg-surface-1/50 hover:text-primary-txt"
          title={!isOpen ? "Settings" : ""}
        >
          <div className="w-12 shrink-0 flex items-center justify-center transition-transform group-hover:rotate-45">
            <Settings size={20} />
          </div>
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

      {/* FOOTER STATUS */}
      <div className="h-12 flex items-center bg-transparent px-2">
        <div className="w-12 shrink-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-success-green shadow-[0_0_8px_#00FF66] animate-pulse"></div>
        </div>
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.span 
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5, transition: { duration: 0.1 } }}
              className="font-mono text-[10px] text-success-green uppercase tracking-wider whitespace-nowrap overflow-hidden"
            >
              System.Online
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};