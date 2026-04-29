import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, X, Mic, Terminal } from 'lucide-react';
import { MCPMessageLog, Message } from './MCPMessageLog'; 
import { useVoice } from '@/context/VoiceContext'; 
import { NeuralCore } from '@/features/mcp/components/NeuralCore';

export const MCPTerminal = () => {
  const { status, transcript, startListening, stopListening } = useVoice(); 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  
  // Use a ref to track if we've already sent the current transcript
  const lastProcessedTranscript = useRef('');

  // 🏛️ 1. AUTOMATIC SEND LOGIC
  // When you stop talking and status hits IDLE, if there's text, send it.
  useEffect(() => {
    if (status === 'IDLE' && input.trim() !== '' && input !== lastProcessedTranscript.current) {
      handleSend();
      lastProcessedTranscript.current = input;
    }
  }, [status]);

  // 🏛️ 2. VOICE ACTIVATION TRIGGER
  useEffect(() => {
    if (status === 'LISTENING') {
      setIsOpen(true);
      lastProcessedTranscript.current = ''; // Reset for new session
    }
  }, [status]);

  // 🏛️ 3. TRANSCRIPT SYNC
  useEffect(() => {
    if (status === 'LISTENING' && transcript) {
      setInput(transcript);
    }
  }, [status, transcript]);

  const handleSend = () => {
    const textToSend = input.trim();
    if (!textToSend) return;
    
    // Add User Message
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: textToSend }]);
    
    // RESET EVERYTHING
    setInput('');
    setShowHistory(true);
    
    // CRITICAL: Ensure voice is stopped so the button turns back to Mic
    if (status !== 'IDLE') stopListening();

    // Simulate JARVIS Reply
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'jarvis', 
        text: "Neural command accepted. Executing logic..." 
      }]);
    }, 800);
  };

  return (
    <>
      {/* GLOBAL VOICE OVERLAY */}
      <AnimatePresence>
        {status === 'LISTENING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-2xl flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center">
              <div className="scale-150 mb-10"><NeuralCore /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-12 left-0 right-0 z-[100] flex flex-col items-center justify-end px-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="prompt-wrapper" className="w-full max-w-5xl flex flex-col items-center pointer-events-none">
              
              <AnimatePresence>
                {showHistory && messages.length > 0 && (
                  <MCPMessageLog messages={messages} onClose={() => setShowHistory(false)} />
                )}
              </AnimatePresence>

              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                exit={{ y: 20, opacity: 0 }}
                className="w-full flex flex-col items-center pointer-events-auto"
              >
                <div className={`w-full transition-all duration-500 bg-surface-1/80 backdrop-blur-3xl border rounded-full p-2 flex items-center
                  ${status === 'LISTENING' ? 'border-jarvis-blue shadow-[0_0_30px_rgba(0,240,255,0.2)]' : 'border-white/10'}
                `}>
                  
                  {/* MINIMIZE */}
                  <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary-txt ml-1">
                    <ChevronLeft size={20} />
                  </button>

                  <span className="text-jarvis-blue font-mono font-bold mx-3">{'>'}</span>
                  
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={status === 'LISTENING' ? "Listening..." : "Initialize command..."}
                    className="flex-1 bg-transparent border-none focus:outline-none text-primary-txt font-mono text-sm placeholder:text-primary-txt/20"
                  />

                  {/* VOICE TOGGLE & SEND */}
                  <div className="flex items-center gap-2 pr-1">
                    <button 
                      onClick={() => {
                        if (status === 'IDLE') startListening();
                        else stopListening();
                      }}
                      className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative z-[120]
                        ${status !== 'IDLE' ? 'bg-jarvis-blue text-black shadow-[0_0_20px_#00F0FF]' : 'hover:bg-white/10 text-secondary-txt'}
                      `}
                    >
                      {status !== 'IDLE' ? <X size={18} /> : <Mic size={18} />}
                    </button>

                    <button 
                      onClick={handleSend}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-jarvis-blue/10 border border-jarvis-blue/30 text-jarvis-blue hover:bg-jarvis-blue hover:text-black transition-all"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* TRIGGER */
            <div className="w-full flex justify-end pointer-events-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-1/90 backdrop-blur-xl border border-jarvis-blue/50 text-jarvis-blue shadow-lg relative"
              >
                {status === 'IDLE' ? <Terminal size={22} /> : <div className="scale-50"><NeuralCore /></div>}
                <div className="absolute inset-0 rounded-full border border-jarvis-blue animate-ping opacity-30" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};