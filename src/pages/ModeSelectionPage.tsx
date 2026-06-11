import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Globe } from 'lucide-react';
import { VariableTypingH2 } from '@/components/ui/VariableTypingH2';
import { ProtocolButton } from '@/components/ui/ProtocolButton';

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
