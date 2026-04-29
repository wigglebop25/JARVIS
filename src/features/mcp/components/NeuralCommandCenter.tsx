import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, Mic, X, Cpu } from 'lucide-react';
import { MCPMessageLog, Message } from './MCPMessageLog'; 
import { useVoice } from '@/context/VoiceContext'; 
import { NeuralCore } from './NeuralCore';

interface CommandCenterProps {
  mode: 'online' | 'offline';
}

export const NeuralCommandCenter = ({ mode }: CommandCenterProps) => {
  const { status, transcript, startListening, stopListening } = useVoice();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const isOffline = mode === 'offline';
  const accentColor = isOffline ? 'var(--color-offline-core)' : 'var(--color-jarvis-blue)';

  // Logic: Open terminal if voice triggers
  useEffect(() => {
    if (status === 'LISTENING') setIsOpen(true);
  }, [status]);

  // Logic: Stream transcript to input
  useEffect(() => {
    if (status === 'LISTENING' && transcript) setInput(transcript);
  }, [status, transcript]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: input }]);
    setInput('');
    // Handle backend MCP call here
  };

  return (
    <>
      {/* 1. BACKDROP OVERLAY: Blurs the entire app behind the command center */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-xl cursor-pointer"
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="center-ui"
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-4xl px-6 flex flex-col items-center pointer-events-auto"
            >
              {/* CHAT LOG AREA */}
              <div className="w-full mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar">
                <MCPMessageLog messages={messages} onClose={() => {}} />
              </div>

              {/* NEURAL CORE: Reactive Animation above the bar */}
              <AnimatePresence>
                {status !== 'IDLE' && (
                  <motion.div 
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0, y: 20 }}
                    className="mb-10"
                  >
                    <NeuralCore />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CENTERED COMMAND BAR */}
              <div className={`w-full bg-surface-1/90 backdrop-blur-3xl border rounded-full p-2 flex items-center transition-all duration-500
                ${status === 'LISTENING' ? 'border-jarvis-blue shadow-[0_0_40px_rgba(0,240,255,0.2)]' : 'border-white/10'}
              `}>
                
                {/* LEFT: Minimize (The arrow you asked for) */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary-txt transition-colors ml-1"
                >
                  <ChevronLeft size={20} />
                </button>

                <span className="text-jarvis-blue font-mono font-bold mx-3">{'>'}</span>
                
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:outline-none text-primary-txt font-mono text-sm placeholder:text-primary-txt/20"
                  placeholder={status === 'LISTENING' ? "Jarvis is listening..." : "Neural command input..."}
                />

                {/* RIGHT ACTIONS: Voice Toggle & Send */}
                <div className="flex items-center gap-2 pr-1">
                  <button 
                    onClick={status === 'IDLE' ? startListening : stopListening}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all
                      ${status !== 'IDLE' ? 'bg-jarvis-blue text-black shadow-[0_0_15px_#00F0FF]' : 'hover:bg-white/10 text-secondary-txt'}
                    `}
                  >
                    {/* The X is now the Voice Toggle button when active */}
                    {status !== 'IDLE' ? <X size={18} /> : <Mic size={18} />}
                  </button>

                  <button 
                    onClick={handleSend}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-jarvis-blue/10 border border-jarvis-blue/30 text-jarvis-blue hover:bg-jarvis-blue hover:text-black transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* FLOATING TRIGGER: Just a small pulse icon in the bottom right when closed */
            <div className="fixed bottom-10 right-10 pointer-events-auto">
              <motion.button
                whileHover={{ scale: 1.1 }}
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-1/80 border border-jarvis-blue/40 text-jarvis-blue shadow-lg relative group"
              >
                <Cpu size={24} className="group-hover:rotate-180 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-full border border-jarvis-blue animate-ping opacity-20" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};