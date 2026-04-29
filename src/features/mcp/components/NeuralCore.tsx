// src/features/ui/components/NeuralCore.tsx
import { motion } from 'framer-motion';
import { useVoice } from '@/context/VoiceContext';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';

export const NeuralCore = () => {
  const { status } = useVoice();
  const volume = useNeuralFrequency(status === 'LISTENING');

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
        className="absolute inset-0 rounded-full border border-jarvis-blue shadow-[0_0_20px_rgba(0,240,255,0.3)]"
      />

      {/* Reactive Frequency Core */}
      <motion.div
        animate={{
          scale: status === 'LISTENING' ? 1 + volume / 100 : 1,
          rotate: isThinking ? 360 : 0,
          borderRadius: status === 'LISTENING' ? ["50%", "40%", "50%"] : "50%"
        }}
        transition={{ 
          rotate: { repeat: Infinity, duration: 1, ease: "linear" },
          scale: { type: "spring", stiffness: 300, damping: 20 }
        }}
        className={`w-12 h-12 bg-gradient-to-tr from-jarvis-blue to-blue-400 shadow-[0_0_30px_#00F0FF] flex items-center justify-center`}
      >
        {/* Inner Technical Detail */}
        <div className="w-4 h-4 bg-base rounded-full border border-white/20 animate-pulse" />
      </motion.div>

      {/* Mode Indicator Text */}
      <div className="absolute -bottom-6 flex flex-col items-center">
        <span className="text-[8px] font-mono text-jarvis-blue tracking-[0.3em] uppercase">
          {status}
        </span>
      </div>
    </div>
  );
};