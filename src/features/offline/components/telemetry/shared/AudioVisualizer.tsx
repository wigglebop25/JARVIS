import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  barCount?: number;
}

export const AudioVisualizer = ({ barCount = 6 }: AudioVisualizerProps) => (
  <div className="flex items-end gap-[2px] h-8">
    {Array.from({ length: barCount }).map((_, idx) => (
      <motion.div
        key={idx}
        animate={{
          height: [4, 12 + Math.random() * 16, 8, 18 + Math.random() * 12, 4].map(h => `${h}px`),
        }}
        transition={{
          duration: 0.6 + idx * 0.15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-[3px] bg-offline-core/80 rounded-t"
      />
    ))}
  </div>
);
