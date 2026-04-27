import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  text: string;
  className?: string;
  onComplete?: () => void;
}

export const VariableTypingH2 = ({ text, className = "", onComplete }: Props) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= text.length) {
      if (onComplete) setTimeout(onComplete, 500);
      return;
    }

    // --- HUMAN-LIKE CADENCE LOGIC ---
    // We create a base speed, then add "hiccups" for a natural feel
    let delay = 40; 

    const char = text[index];
    const isSpecialChar = char === '_' || char === ' ' || char === '.';

    if (isSpecialChar) {
      // System "pauses" slightly at word boundaries or symbols
      delay = Math.floor(Math.random() * (200 - 150 + 1)) + 150;
    } else {
      // Rapid fire for standard letters with slight variance
      delay = Math.floor(Math.random() * (70 - 30 + 1)) + 30;
    }

    const timeout = setTimeout(() => {
      setDisplayedText((prev) => prev + text[index]);
      setIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timeout);
  }, [index, text, onComplete]);

  return (
    <div className={`relative inline-block ${className}`}>
      <h2 className="font-mono text-jarvis-blue text-xs tracking-[0.5em] uppercase flex items-center">
        {/* The typed content */}
        <span className="opacity-80">{displayedText}</span>
        
        {/* The Block Cursor - Pinned to the end */}
        <AnimatePresence>
          {index <= text.length && (
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.6, // Slightly faster blink for a "waiting" feel
              }}
              className="inline-block w-[8px] h-[14px] bg-jarvis-blue ml-2 translate-y-[1px] shadow-[0_0_8px_#00F0FF]"
            />
          )}
        </AnimatePresence>
      </h2>
      
      {/* Invisible ghost text to maintain layout width and prevent jumping */}
      <h2 className="font-mono text-xs tracking-[0.5em] uppercase opacity-0 pointer-events-none select-none">
        {text}
      </h2>
    </div>
  );
};