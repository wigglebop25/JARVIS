import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Cpu, X } from 'lucide-react';
import { MCPMessageLog, Message } from './MCPMessageLog'; 

// Fake JARVIS responses for testing
const MOCK_RESPONSES = [
  "Processing request... Bypass successful.",
  "I cannot authorize that command without override privileges.",
  "Neural uplink stabilized. Node recalibrated.",
  "Scanning fleet... 3 anomalies detected in sector 4.",
  "Executing protocol. Please hold."
];

export const MCPTerminal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  
  // New States for History
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const handleSend = () => {
    if (!input.trim()) return;
    
    // 1. Add User Message
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setShowHistory(true); // Ensure history pops open if they hid it

    // 2. Simulate Backend Delay and JARVIS Response
    setTimeout(() => {
      const randomReply = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
      const jarvisMsg: Message = { id: (Date.now() + 1).toString(), sender: 'jarvis', text: randomReply };
      setMessages(prev => [...prev, jarvisMsg]);
    }, 800); // 800ms delay feels like it's "thinking"
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
    if (e.key === 'Escape') setIsOpen(false); 
  };

  return (
    <div className="absolute bottom-8 left-0 right-0 z-[100] flex flex-col items-center justify-end px-8 sm:px-12 pointer-events-none">
      
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="prompt-wrapper"
            className="w-full max-w-5xl flex flex-col items-center pointer-events-none"
          >
            {/* --- NEW: THE CHAT HISTORY LOG --- */}
            <AnimatePresence>
              {showHistory && messages.length > 0 && (
                <MCPMessageLog 
                  messages={messages} 
                  onClose={() => setShowHistory(false)} 
                />
              )}
            </AnimatePresence>

            {/* --- THE WIDE PROMPT BAR --- */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "100%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full flex flex-col items-center pointer-events-auto origin-center"
            >
              {/* Floating Circle Icon (Only show if history is hidden or empty) */}
              {(!showHistory || messages.length === 0) && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="mb-4 w-12 h-12 rounded-full bg-surface-1/80 backdrop-blur-xl border border-jarvis-blue/40 shadow-[0_0_20px_rgba(0,240,255,0.2)] flex items-center justify-center"
                >
                  <Cpu size={24} className="text-jarvis-blue animate-pulse" />
                </motion.div>
              )}

              {/* The Fully Rounded Prompt Box */}
              <div className="w-full bg-surface-1/80 backdrop-blur-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-full p-2 pl-6 flex items-center">
                <span className="text-jarvis-blue font-mono font-bold mr-3">{'>'}</span>
                
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Initialize neural command..."
                  className="flex-1 bg-transparent border-none focus:outline-none text-primary-txt font-mono text-sm placeholder:text-primary-txt/40"
                />

                <button 
                  onClick={() => setIsOpen(false)}
                  title="Return to Icon (Esc)"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-surface-3 hover:text-white transition-colors mr-2"
                >
                  <X size={16} />
                </button>

                <button 
                  onClick={handleSend}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-jarvis-blue/10 border border-jarvis-blue/30 text-jarvis-blue hover:bg-jarvis-blue hover:text-black transition-all hover:scale-105"
                >
                  <Send size={16} className="transform -translate-x-[1px] translate-y-[1px]" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          /* --- THE TRIGGER BUTTON --- */
          <motion.div 
            key="trigger-btn"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-full flex justify-end pointer-events-auto"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center bg-jarvis-blue/10 border border-jarvis-blue/50 text-jarvis-blue shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-colors relative"
            >
              <Terminal size={22} />
              <div className="absolute inset-0 rounded-full border border-jarvis-blue animate-ping opacity-30" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};