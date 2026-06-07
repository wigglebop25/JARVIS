import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, X, Mic, Terminal, Paperclip, FileText } from 'lucide-react';
import { MCPMessageLog, Message } from './MCPMessageLog'; 
import { useVoice } from '@/context/VoiceContext'; 
import { NeuralCore } from '@/features/mcp/components/NeuralCore';
import { streamPrompt, countTokens, createSession } from '@/services/chatService';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';
import { open } from '@tauri-apps/plugin-dialog';

// ─── Voice Waveform Visualizer (Online Theme Matcher) ──────────────────────
const VoiceWaveform = ({ volume }: { volume: number }) => {
  const barCount = 16;
  const normalizedVol = Math.min(100, Math.max(0, volume));

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.8 }}
      className="flex items-center gap-[2px] h-8 px-2"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Create a wave pattern that's taller in the center
        const centerWeight = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
        const randomFactor = 0.4 + Math.random() * 0.6;
        const height = Math.max(3, (normalizedVol / 100) * 24 * centerWeight * randomFactor);

        return (
          <motion.div
            key={i}
            animate={{ height }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className="w-[2px] rounded-full bg-theme-accent/80"
          />
        );
      })}
    </motion.div>
  );
};

export const MCPTerminal = () => {
  const { status, transcript, startListening, stopListening, setStatus } = useVoice(); 
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [promptTokens, setPromptTokens] = useState<number>(0);
  const [isCalculatingTokens, setIsCalculatingTokens] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Use a ref to track if we've already sent the current transcript
  const lastProcessedTranscript = useRef('');
  const tokenDebounceRef = useRef<any>(null);

  interface AttachedFile {
    id: string;
    path: string;
    name: string;
  }

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  const handleAttachClick = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Documents',
          extensions: ['txt', 'md', 'pdf']
        }]
      });

      if (!selected) return; // User cancelled
      
      const paths = Array.isArray(selected) ? selected : [selected];
      const newFiles: AttachedFile[] = [];

      for (const selectedPath of paths) {
        if (attachedFiles.some(f => f.path === selectedPath)) continue;

        const fileName = selectedPath.split(/[/\\]/).pop() || selectedPath;
        newFiles.push({
          id: `${selectedPath}-${Date.now()}-${Math.random()}`,
          path: selectedPath,
          name: fileName
        });
      }

      if (newFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error("Failed to select file:", err);
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Live prompt token counting
  const handleInputChange = (val: string) => {
    setInput(val);
    if (!val.trim()) {
      setPromptTokens(0);
      setIsCalculatingTokens(false);
      if (tokenDebounceRef.current) {
        clearTimeout(tokenDebounceRef.current);
      }
      return;
    }

    setIsCalculatingTokens(true);

    if (tokenDebounceRef.current) {
      clearTimeout(tokenDebounceRef.current);
    }

    tokenDebounceRef.current = setTimeout(async () => {
      try {
        const res = await countTokens(val);
        setPromptTokens(res.prompt_tokens);
      } catch (err) {
        console.error("Failed to count tokens:", err);
      } finally {
        setIsCalculatingTokens(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (tokenDebounceRef.current) {
        clearTimeout(tokenDebounceRef.current);
      }
    };
  }, []);

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
    const paths = attachedFiles.map(f => f.path);
    if (!textToSend && paths.length === 0) return;

    let displayMessage = textToSend;
    if (paths.length > 0) {
      const attachmentsHeader = paths.map(p => `[Attached: ${p}]`).join('\n');
      displayMessage = `${attachmentsHeader}\n${textToSend}`;
    }
    
    // Calculate user prompt tokens
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

    // Add User Message
    const userMsg: Message = { 
      id: userId, 
      sender: 'user', 
      text: displayMessage,
      tokenCount: userTokensCount
    };
    // Prepare assistant message
    const assistantMsg: Message = {
      id: assistantId,
      sender: 'jarvis',
      text: ''
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    
    // RESET INPUT & ATTACHMENTS
    setInput('');
    setPromptTokens(0);
    setAttachedFiles([]);
    setShowHistory(true);
    setStatus('THINKING');
    
    // Ensure voice is stopped
    if (status === 'LISTENING') stopListening();

    try {
      // Ensure we have a session, create one on-the-fly if needed
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
      
      // Query final exact tokens
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
  };

  const frequency = useNeuralFrequency(status === 'LISTENING');
  const scale = 1 + (frequency / 100) * 0.6; // Scale factor for voice rings

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
                  <MCPMessageLog 
                    messages={messages} 
                    isThinking={status === 'THINKING'} 
                    onClose={() => setShowHistory(false)}
                  />
                )}
              </AnimatePresence>

              <div className="w-full flex flex-col items-center pointer-events-auto">
                {/* Attached Files List */}
                <AnimatePresence>
                  {attachedFiles.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full flex flex-wrap gap-2 px-6 pb-3 mb-2 border-b border-white/5 justify-start"
                    >
                      {attachedFiles.map(file => (
                        <motion.div
                          key={file.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-secondary-txt text-xs font-mono select-none backdrop-blur-md transition-all hover:bg-white/10"
                          title={file.path}
                        >
                          <FileText size={12} className="opacity-75" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-0.5 rounded hover:bg-white/10 text-tertiary-txt hover:text-white transition-colors cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        <VoiceWaveform volume={frequency} />
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
                {status === 'IDLE' ? <Terminal size={22} /> : <div className="scale-50"><NeuralCore /></div>}
                <div className="absolute inset-0 rounded-full border border-theme-accent animate-ping opacity-30" />
              </motion.button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};