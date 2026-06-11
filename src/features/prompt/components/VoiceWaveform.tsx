import { motion } from 'framer-motion';

interface VoiceWaveformProps {
  volume: number;
  barColor?: string;
  barCount?: number;
  maxHeight?: number;
}

export const VoiceWaveform = ({ volume, barColor = 'bg-theme-accent/80', barCount = 16, maxHeight = 24 }: VoiceWaveformProps) => {
  const normalizedVol = Math.min(100, Math.max(0, volume));

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.8 }}
      className="flex items-center gap-[2px] h-8 px-2"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const centerWeight = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
        const randomFactor = 0.4 + Math.random() * 0.6;
        const height = Math.max(3, (normalizedVol / 100) * maxHeight * centerWeight * randomFactor);

        return (
          <motion.div
            key={i}
            animate={{ height }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className={`w-[2px] rounded-full ${barColor}`}
          />
        );
      })}
    </motion.div>
  );
};
