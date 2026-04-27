import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Globe } from 'lucide-react';
import { VariableTypingH2 } from '@/components/ui/VariableTypingH2';

export const ModeSelectionPage = ({ onSelect }: { onSelect: (mode: 'online' | 'offline') => void }) => {
  const [isHeaderDone, setIsHeaderDone] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[50] overflow-hidden"
    >
      {/* Visual background noise for the selection screen */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

      <VariableTypingH2 
        text="Select_Operation_Protocol" 
        onComplete={() => setIsHeaderDone(true)}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={isHeaderDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex gap-8"
      >
        {/* LOCAL MODE */}
        <ProtocolButton 
          title="Local_Mode"
          desc="Encrypted Offline Protocol"
          icon={<Shield size={24} />}
          onClick={() => onSelect('offline')}
          activeColor="var(--color-offline-core)"
        />

        {/* SYNCHRONIZED MODE */}
        <ProtocolButton 
          title="Sync_Mode"
          desc="Cloud & Microservice Node"
          icon={<Globe size={24} />}
          onClick={() => onSelect('online')}
          activeColor="var(--color-jarvis-blue)"
        />
      </motion.div>
    </motion.div>
  );
};

const ProtocolButton = ({ title, desc, icon, onClick, activeColor }: any) => (
  <button 
    onClick={onClick}
    style={{ '--hover-accent': activeColor } as React.CSSProperties}
    className="w-72 p-10 border border-white/5 hover:border-[var(--hover-accent)] bg-white/[0.01] hover:bg-[var(--hover-accent)]/[0.02] transition-all duration-500 group flex flex-col items-center gap-6 text-center relative overflow-hidden"
  >
    {/* Corner accents for that industrial look */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-[var(--hover-accent)] transition-colors" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-[var(--hover-accent)] transition-colors" />

    <div className="text-white/20 group-hover:text-[var(--hover-accent)] transition-all duration-500 transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--hover-accent)]">
      {icon}
    </div>
    
    <div className="space-y-2">
      <h3 className="font-mono text-sm text-white/40 group-hover:text-white uppercase tracking-[0.2em] transition-colors">
        {title}
      </h3>
      <p className="font-mono text-[9px] text-white/20 group-hover:text-white/40 tracking-wider">
        {desc}
      </p>
    </div>

    {/* Subtle progress bar at bottom of button */}
    <div className="absolute bottom-0 left-0 h-[1px] bg-[var(--hover-accent)] w-0 group-hover:w-full transition-all duration-700" />
  </button>
);