import { motion } from 'framer-motion';
import { Shield, Globe } from 'lucide-react';

export const ModeSelectionPage = ({ onSelect }: { onSelect: (mode: 'online' | 'offline') => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-black z-[50]"
    >
      <h2 className="font-mono text-jarvis-blue text-xs tracking-[0.5em] mb-12 uppercase opacity-50">
        Select_Operation_Protocol
      </h2>

      <div className="flex gap-8">
        {/* LOCAL MODE */}
        <ProtocolButton 
          title="Local_Mode"
          desc="Encrypted Offline Protocol"
          icon={<Shield size={24} />}
          onClick={() => onSelect('offline')}
        />

        {/* SYNCHRONIZED MODE */}
        <ProtocolButton 
          title="Sync_Mode"
          desc="Cloud & Microservice Node"
          icon={<Globe size={24} />}
          onClick={() => onSelect('online')}
        />
      </div>
    </motion.div>
  );
};

const ProtocolButton = ({ title, desc, icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className="w-64 p-8 border border-white/5 hover:border-jarvis-blue/40 bg-white/[0.02] hover:bg-jarvis-blue/[0.02] transition-all group flex flex-col items-center gap-4 text-center"
  >
    <div className="text-white/20 group-hover:text-jarvis-blue transition-colors duration-500">
      {icon}
    </div>
    <div>
      <h3 className="font-mono text-sm text-white/60 group-hover:text-white uppercase tracking-wider">{title}</h3>
      <p className="text-[10px] text-white/30 mt-1">{desc}</p>
    </div>
  </button>
);