import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power } from 'lucide-react'; 
import { useTheme } from '@/context/ThemeContext';

export const IntroBootSequence = ({ onComplete }: { onComplete: () => void }) => {
  const { theme: _theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");

  useEffect(() => {
    setVideoSrc('/videos/jarvis_intro.mp4');
  }, []);

  // NEW: Global Skip Logic
  useEffect(() => {
    const handleSkip = (e: KeyboardEvent | MouseEvent) => {
      // Only allow skipping if the video has actually started playing
      if (!hasStarted) return;

      // If keyboard, allow Space or Enter
      if (e instanceof KeyboardEvent) {
        if (e.code === 'Space' || e.key === 'Enter') {
          onComplete();
        }
      } else {
        // If mouse click
        onComplete();
      }
    };

    window.addEventListener('keydown', handleSkip);
    window.addEventListener('mousedown', handleSkip);

    return () => {
      window.removeEventListener('keydown', handleSkip);
      window.removeEventListener('mousedown', handleSkip);
    };
  }, [hasStarted, onComplete]);

  const startSystem = () => {
    setHasStarted(true);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error("BOOT_LOAD_ERROR:", err);
          onComplete(); 
        });
      }
    }, 100);
  };

  return (
    <motion.div
      exit={{ opacity: 0, transition: { duration: 0.8 } }}
      className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.button
            key="power-btn"
            onClick={startSystem}
            className="flex flex-col items-center gap-4 group"
          >
            <div className="w-20 h-20 rounded-full border border-theme-accent/20 flex items-center justify-center group-hover:shadow-[0_0_30px_rgba(var(--theme-accent-rgb),0.2)] transition-all duration-500">
              <Power className="text-theme-accent/40 group-hover:text-theme-accent" size={32} />
            </div>
            <span className="font-mono text-[10px] tracking-[0.3em] text-theme-accent/40 uppercase">
              INITIALIZE_CORE
            </span>
          </motion.button>
        ) : (
          <motion.div key="video-layer" className="w-full h-full">
            <video
              ref={videoRef}
              playsInline
              onEnded={onComplete}
              className="w-full h-full object-cover"
            >
              {videoSrc && <source src={videoSrc} type="video/mp4" />}
              <source src="/videos/jarvis_intro.mp4" type="video/mp4" />
            </video>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};