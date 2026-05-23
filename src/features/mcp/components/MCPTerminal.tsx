import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, X, Mic, Terminal } from 'lucide-react';
import { MCPMessageLog, Message } from './MCPMessageLog'; 
import { useVoice } from '@/context/VoiceContext'; 
import { NeuralCore } from '@/features/mcp/components/NeuralCore';
import { sendPrompt, createSession } from '@/services/chatService';

export const MCPTerminal = () => {
  const { status, transcript, startListening, stopListening, setStatus } = useVoice(); 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize a chat session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const id = await createSession("MCP Terminal");
        setSessionId(id);
      } catch (err) {
        console.error("Failed to create MCP terminal session:", err);
      }
    };
    initSession();
  }, []);
  
  // Use a ref to track if we've already sent the current transcript
  const lastProcessedTranscript = useRef('');

  // 🏛️ 1. AUTOMATIC SEND LOGIC
  // When the transcriber finishes (transcript arrives), if we're open, send it.
  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript.current) {
      setInput(transcript);
      lastProcessedTranscript.current = transcript;
      handleSend(transcript);
    }
  }, [transcript]);

  // 🏛️ 2. VOICE ACTIVATION TRIGGER
  useEffect(() => {
    if (status === 'LISTENING') {
      setIsOpen(true);
    }
  }, [status]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend) return;
    
    // Add User Message
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text: textToSend }]);
    
    // RESET INPUT
    setInput('');
    setShowHistory(true);
    setIsThinking(true);
    setStatus('THINKING');
    
    // Ensure voice is stopped
    if (status === 'LISTENING') stopListening();

    try {
      // Ensure we have a session, create one on-the-fly if needed
      let sid = sessionId;
      if (!sid) {
        sid = await createSession("MCP Terminal");
        setSessionId(sid);
      }
      const response = await sendPrompt(sid, textToSend);
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'jarvis', 
        text: response.message 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'jarvis', 
        text: `Error: ${err}` 
      }]);
    } finally {
      setIsThinking(false);
      setStatus('IDLE');
    }
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
                  ${status === 'LISTENING' ? 'border-jarvis-blue shadow-[0_0_30px_rgba(0,240,255,0.2)]' : 
                    status === 'THINKING' ? 'border-success-green animate-pulse shadow-[0_0_20px_rgba(0,255,102,0.1)]' :
                    'border-white/10'}
                `}>
                  
                  {/* MINIMIZE */}
                  <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary-txt ml-1">
                    <ChevronLeft size={20} />
                  </button>

                  <span className={`${status === 'THINKING' ? 'text-success-green' : 'text-jarvis-blue'} font-mono font-bold mx-3`}>{'>'}</span>
                  
                  <input
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={
                      status === 'LISTENING' ? "Listening..." : 
                      status === 'THINKING' ? "JARVIS is thinking..." : 
                      "Initialize command..."
                    }
                    disabled={status === 'THINKING'}
                    className="flex-1 bg-transparent border-none focus:outline-none text-primary-txt font-mono text-sm placeholder:text-primary-txt/20 disabled:opacity-50"
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
                      onClick={() => handleSend()}
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
            <div className="w-full flex justify-end pointer-events-none">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-surface-1/90 backdrop-blur-xl border border-jarvis-blue/50 text-jarvis-blue shadow-lg relative pointer-events-auto"
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