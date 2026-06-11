import { motion } from 'framer-motion';
import { useVoice } from '@/context/VoiceContext';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';

export const VoiceStatusOrb = () => {
  const { status } = useVoice();
  const volume = useNeuralFrequency(status === 'LISTENING');
  const isOffline = sessionStorage.getItem('jarvis_mode') === 'offline';

  // Variations based on JARVIS state
  const isActive = status !== 'IDLE';
  const isThinking = status === 'THINKING';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Outer Pulse Ring */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
          opacity: isActive ? [0.2, 0.5, 0.2] : 0.1,
          borderWidth: isThinking ? '4px' : '2px'
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`absolute inset-0 rounded-full border ${
          isOffline 
            ? 'border-offline-core/40 shadow-[0_0_20px_rgba(244,244,245,0.2)]' 
            : 'border-theme-accent shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.3)]'
        }`}
      />

      {/* Reactive Frequency Core */}
      <motion.div
        animate={{
          scale: status === 'LISTENING' ? 1 + volume / 100 : 1,
          rotate: (isThinking || status === 'WAKING') ? 360 : 0,
          borderRadius: status === 'LISTENING' ? ["50%", "40%", "50%"] : "50%"
        }}
        transition={{ 
          rotate: { repeat: Infinity, duration: isThinking ? 1.5 : 4, ease: "linear" },
          scale: { type: "spring", stiffness: 300, damping: 20 }
        }}
        className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-tr ${
          isOffline 
            ? 'from-offline-core/50 to-offline-core shadow-[0_0_30px_rgba(244,244,245,0.35)]' 
            : 'from-theme-accent to-theme-accent/70 shadow-[0_0_30px_var(--theme-accent)]'
        }`}
      >
        {/* Inner Technical Detail */}
        <div className="w-4 h-4 bg-base rounded-full border border-white/20 animate-pulse" />
      </motion.div>

    </div>
  );
};
