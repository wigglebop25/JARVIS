import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, X, Mic, Terminal, Paperclip } from 'lucide-react';
import { MessageLog } from './components/MessageLog';
import type { Message } from './types';
import { useVoice } from '@/context/VoiceContext'; 
import { VoiceStatusOrb } from './VoiceStatusOrb';
import { streamPrompt, countTokens, createSession } from '@/services/chatService';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';
import { VoiceWaveform, AttachedFileChips, useFileAttachments, useTokenCount, useAutoSendTranscript } from '@/features/prompt';

export const OnlinePromptOverlay = () => {
  const { status, transcript, startListening, stopListening, setStatus } = useVoice(); 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { files: attachedFiles, add: handleAttachClick, remove: removeFile, clear: clearFiles } = useFileAttachments();
  const { tokens: promptTokens, isCalculating: isCalculatingTokens, update: updateTokenCount } = useTokenCount();

  const handleInputChange = (val: string) => {
    setInput(val);
    updateTokenCount(val);
  };

  // 🏛️ 1. VOICE ACTIVATION TRIGGER
  useEffect(() => {
    if (status === 'LISTENING') {
      setIsOpen(true);
    }
  }, [status]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    const paths = attachedFiles.map(f => f.path);
    if (!textToSend && paths.length === 0) return;

    let displayMessage = textToSend;
    if (paths.length > 0) {
      const attachmentsHeader = paths.map(p => `[Attached: ${p}]`).join('\n');
      displayMessage = `${attachmentsHeader}\n${textToSend}`;
    }
    
    let userTokensCount = promptTokens;
    if (userTokensCount === 0 && textToSend) {
      try {
        const countRes = await countTokens(textToSend);
        userTokensCount = countRes.prompt_tokens;
      } catch (e) {
        userTokensCount = Math.ceil(textToSend.length / 4);
      }
    }

    const userId = `user-${Date.now()}`;
    const assistantId = `jarvis-${Date.now()}`;

    const userMsg: Message = { 
      id: userId, 
      sender: 'user', 
      text: displayMessage,
      tokenCount: userTokensCount
    };
    const assistantMsg: Message = {
      id: assistantId,
      sender: 'jarvis',
      text: ''
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    
    setInput('');
    clearFiles();
    setShowHistory(true);
    setStatus('THINKING');
    
    if (status === 'LISTENING') stopListening();

    try {
      let sid = sessionId;
      if (!sid) {
        sid = await createSession(textToSend.substring(0, 30) || "Document Query");
        setSessionId(sid);
      }
      
      let accumulatedText = '';
      let hasTokens = false;

      const response = await streamPrompt(sid, textToSend, paths, (token) => {
        if (!hasTokens) {
          setStatus('IDLE');
          hasTokens = true;
        }
        accumulatedText += token;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: accumulatedText } : m));
      });
      
      let finalPromptTokens = userTokensCount;
      let responseTokens = 0;
      try {
        const tokenRes = await countTokens(textToSend, response.message);
        finalPromptTokens = tokenRes.prompt_tokens;
        responseTokens = tokenRes.response_tokens;
      } catch (err) {
        console.warn("Failed to get exact final token counts:", err);
        responseTokens = Math.ceil(response.message.length / 4);
      }

      setMessages(prev => prev.map(m => {
        if (m.id === userId) {
          return { ...m, tokenCount: finalPromptTokens };
        }
        if (m.id === assistantId) {
          return { ...m, text: response.message, tokenCount: responseTokens };
        }
        return m;
      }));
    } catch (err) {
      console.error("Streaming error:", err);
      setMessages(prev => prev.map(m => {
        if (m.id === assistantId) {
          return { ...m, text: `Error: ${err}` };
        }
        return m;
      }));
    } finally {
      setStatus('IDLE');
    }
  }, [input, attachedFiles, promptTokens, sessionId, status, stopListening]);

  useAutoSendTranscript({ status, transcript, onSend: handleSend });

  const frequency = useNeuralFrequency(status === 'LISTENING');
  const scale = 1 + (frequency / 100) * 0.6;

  return (
    <>
      <div className="fixed bottom-12 left-0 right-0 z-[100] flex flex-col items-center justify-end px-8 pointer-events-none">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div 
              key="prompt-wrapper" 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-5xl flex flex-col items-center pointer-events-none"
            >
              
              <AnimatePresence>
                {showHistory && messages.length > 0 && (
                  <MessageLog theme="online" variant="overlay"
                    messages={messages} 
                    isThinking={status === 'THINKING'} 
                    onClose={() => setShowHistory(false)}
                  />
                )}
              </AnimatePresence>

              <div className="w-full flex flex-col items-center pointer-events-auto">
                {/* Attached Files List */}
                <AttachedFileChips files={attachedFiles} onRemove={removeFile} />

                <div className={`w-full transition-all duration-500 bg-theme-surface-1 backdrop-blur-3xl border rounded-full p-2 flex items-center
                  ${status === 'LISTENING' ? 'border-theme-accent shadow-[0_0_30px_rgba(var(--theme-accent-rgb),0.2)]' : 
                    status === 'THINKING' ? 'border-success-green animate-pulse shadow-[0_0_20px_rgba(0,255,102,0.1)]' :
                    'border-theme-border'}
                `}>
                  
                  {/* MINIMIZE */}
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary-txt ml-1 cursor-pointer"
                    title="Minimize"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <span className={`${status === 'THINKING' ? 'text-success-green' : 'text-theme-accent'} font-mono font-bold mx-3`}>{'>'}</span>
                  
                  <AnimatePresence mode="wait">
                    {status === 'LISTENING' ? (
                      <motion.div
                        key="listening-waveform"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex-1 flex items-center gap-3 h-10"
                      >
                        <span className="text-[11px] font-mono text-theme-accent uppercase tracking-[0.2em] animate-pulse">
                          Listening
                        </span>
                        <VoiceWaveform volume={frequency} barColor="bg-theme-accent/80" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="input-box"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex-1"
                      >
                        <input
                          autoFocus
                          value={input}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (input.trim() || attachedFiles.length > 0) {
                                handleSend();
                              }
                            }
                          }}
                          placeholder={
                            status === 'THINKING' ? "JARVIS is thinking..." : 
                            "Initialize command..."
                          }
                          disabled={status === 'THINKING'}
                          className="w-full bg-transparent border-none focus:outline-none text-primary-txt font-mono text-sm placeholder:text-primary-txt/20 disabled:opacity-50"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* VOICE TOGGLE & SEND */}
                  <div className="flex items-center gap-2 pr-1">
                    
                    {/* Document Attachment Button */}
                    <button 
                      type="button"
                      onClick={handleAttachClick}
                      disabled={status === 'THINKING'}
                      title="Attach document (.txt, .md, .pdf)"
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-secondary-txt transition-all disabled:opacity-20 cursor-pointer"
                    >
                      <Paperclip size={18} />
                    </button>

                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <button 
                        onClick={() => {
                          if (status === 'IDLE') startListening();
                          else stopListening();
                        }}
                        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all relative z-[120] cursor-pointer
                          ${status !== 'IDLE' ? 'bg-theme-accent text-black shadow-[0_0_20px_rgba(var(--theme-accent-rgb),0.4)]' : 'hover:bg-white/10 text-secondary-txt'}
                        `}
                      >
                        {status !== 'IDLE' ? <X size={18} /> : <Mic size={18} />}
                      </button>

                      {status === 'LISTENING' && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[110]">
                          <motion.div
                            animate={{ scale: scale, opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 0.1 }}
                            className="absolute w-12 h-12 rounded-full border border-theme-accent/60 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.3)]"
                          />
                          <motion.div
                            animate={{ scale: scale * 1.35, rotate: 360 }}
                            transition={{ rotate: { repeat: Infinity, duration: 12, ease: "linear" }, scale: { duration: 0.1 } }}
                            className="absolute w-12 h-12 rounded-full border border-dashed border-theme-accent/40"
                          />
                          <motion.div
                            animate={{ scale: scale * 1.7, opacity: [0.15, 0.3, 0.15] }}
                            transition={{ duration: 0.1 }}
                            className="absolute w-12 h-12 rounded-full border border-dotted border-theme-accent/20"
                          />
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleSend()}
                      disabled={status === 'THINKING' || (!input.trim() && attachedFiles.length === 0)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-theme-accent/10 border border-theme-accent/30 text-theme-accent hover:bg-theme-accent hover:text-black transition-all disabled:opacity-20 cursor-pointer"
                      title="Send Command"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>

                {/* Technical Info under input bar */}
                <div className="w-full flex justify-between px-6 mt-2 select-none pointer-events-none">
                  <div className="text-[10px] font-mono text-secondary-txt/45 font-bold uppercase tracking-widest min-h-[15px]">
                    {input.trim() ? (
                      isCalculatingTokens ? (
                        <span>[PROMPT_TOKENS: <span className="animate-pulse">...</span>]</span>
                      ) : (
                        `[PROMPT_TOKENS: ${promptTokens}]`
                      )
                    ) : ''}
                  </div>
                  <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.4em]">
                    Neural_Bypass_v2.4
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            /* TRIGGER */
            <div className="w-full flex justify-end pointer-events-none">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-theme-surface-1 backdrop-blur-xl border border-theme-accent/50 text-theme-accent shadow-lg relative pointer-events-auto cursor-pointer"
              >
                {status === 'IDLE' ? <Terminal size={22} /> : <div className="scale-50"><VoiceStatusOrb /></div>}
                <div className="absolute inset-0 rounded-full border border-theme-accent animate-ping opacity-30" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
