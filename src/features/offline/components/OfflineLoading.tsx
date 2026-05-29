import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineLoadingProps {
  theme?: 'online' | 'offline';
  compact?: boolean;
}

export const OfflineLoading = ({ theme = 'offline', compact = false }: OfflineLoadingProps) => {
  const text = "PROCESSING_COMMAND...";
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= text.length) return;

    let delay = 45; 
    const char = text[index];
    const isSpecialChar = char === '_' || char === ' ' || char === '.';

    if (isSpecialChar) {
      delay = 140;
    } else {
      delay = 40 + Math.floor(Math.random() * 25);
    }

    const timeout = setTimeout(() => {
      setDisplayedText((prev) => prev + text[index]);
      setIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [index, text]);

  const isOffline = theme === 'offline';
  const textColorClass = isOffline ? 'text-offline-core' : 'text-theme-accent';
  const bgCursorClass = isOffline ? 'bg-offline-core' : 'bg-theme-accent';
  const cursorShadowClass = isOffline ? 'shadow-[0_0_8px_var(--color-offline-core)]' : 'shadow-[0_0_8px_var(--theme-accent)]';

  return (
    <div className={`flex ${compact ? 'p-0' : 'px-4 py-4'} items-center`}>
      <div className="relative inline-block font-mono">
        <h2 className={`${textColorClass} text-xs tracking-[0.25em] uppercase flex items-center`}>
          {/* The typed content */}
          <span className="opacity-80 font-bold">{displayedText}</span>
          
          {/* The Block Cursor */}
          <AnimatePresence>
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.6,
              }}
              className={`inline-block w-[6px] h-[12px] ${bgCursorClass} ml-2 translate-y-[0px] ${cursorShadowClass}`}
            />
          </AnimatePresence>
        </h2>
      </div>
    </div>
  );
};