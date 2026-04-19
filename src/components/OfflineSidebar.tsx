import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import JarvisIcon from '@/assets/jarvislogofinal.svg';
import { Settings, ChevronFirst, ChevronLast, Terminal, Globe, ShieldCheck } from 'lucide-react';

export const OfflineSidebar = ({ onSettingsClick }: { onSettingsClick: () => void }) => {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const exitOffline = () => {
    sessionStorage.removeItem('jarvis_mode'); 
    window.dispatchEvent(new Event('go-to-selection')); 
  };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? "16rem" : "4rem" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-full bg-[#080a0f]/80 backdrop-blur-xl border-r border-[#0EA5E9]/20 flex flex-col z-40 relative shrink-0"
    >
      {/* HEADER: Identical to Online Sidebar */}
      <div className="h-14 flex items-center border-b border-white/5 relative px-2">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-3">
              <img src={JarvisIcon} alt="Logo" className="ml-[1px] w-10 h-10 grayscale brightness-125 contrast-125" />
              <span className="font-mono text-primary-txt font-bold tracking-[0.2em] text-sm">JARVIS</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center justify-center text-secondary-txt hover:text-[#0EA5E9] ${isOpen ? 'ml-auto w-8 h-8' : 'absolute -right-3 top-4 w-6 h-6 bg-[#11141b] border border-[#0EA5E9]/30 rounded-full'}`}>
          {isOpen ? <ChevronFirst size={18} /> : <ChevronLast size={14} />}
        </button>
      </div>

      {/* RESTRICTED NAV: Only Terminal & Mode Swap */}
      <nav className="flex-1 py-4 flex flex-col gap-2 px-2 overflow-hidden">
        {/* Active Terminal Link */}
        <div className="flex items-center h-10 rounded-md bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30 shadow-[inset_2px_0_0_#0EA5E9]">
          <div className="w-12 shrink-0 flex items-center justify-center"><Terminal size={20} /></div>
          {isOpen && <span className="font-mono text-sm">Local_Terminal</span>}
        </div>

        {/* Sync Back to Online */}
        <button onClick={exitOffline} className="flex items-center h-10 rounded-md text-secondary-txt hover:bg-white/5 hover:text-[#0EA5E9] transition-all group">
          <div className="w-12 shrink-0 flex items-center justify-center group-hover:animate-pulse"><Globe size={20} /></div>
          {isOpen && <span className="font-mono text-sm">Sync_Uplink</span>}
        </button>
      </nav>

      {/* BOTTOM SECTION */}
      <div className="mt-auto flex flex-col pb-2 px-2 gap-2">
        <button onClick={onSettingsClick} className="w-full flex items-center h-10 rounded-md text-secondary-txt hover:bg-white/5 hover:text-primary-txt">
          <div className="w-12 shrink-0 flex items-center justify-center"><Settings size={20} /></div>
          {isOpen && <span className="font-mono text-sm">Settings</span>}
        </button>
      </div>

      {/* SECURE STATUS FOOTER */}
      <div className="h-12 flex items-center border-t border-white/5 bg-transparent px-2">
        <div className="w-12 shrink-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#0EA5E9] shadow-[0_0_8px_#0EA5E9] animate-pulse"></div>
        </div>
        {isOpen && <span className="font-mono text-[10px] text-[#0EA5E9] uppercase tracking-wider">Node.AirGapped</span>}
      </div>
    </motion.aside>
  );
};