import React, { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Shield, Loader2, Mic, X, Command, Paperclip, FileText } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';
import { open } from '@tauri-apps/plugin-dialog';
import { countTokens } from '@/services/chatService';

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: (overrideText?: string, attachments?: string[]) => void;
  disabled?: boolean;
}

// ─── Slash Commands ─────────────────────────────────────────────────────────

const SLASH_COMMANDS = [
  { command: '/volume', description: 'Adjust system audio output level', args: '<0-100>' },
  { command: '/reboot', description: 'Restart the local host machine', args: '' },
  { command: '/translate', description: 'Translate on-screen text', args: '<target_lang>' },
  { command: '/obs-record', description: 'Toggle OBS screen recording', args: '<start|stop>' },
  { command: '/status', description: 'Display current system diagnostics', args: '' },
  { command: '/bluetooth', description: 'Toggle Bluetooth hardware radio', args: '<on|off>' },
  { command: '/wifi', description: 'Toggle Wi-Fi hardware radio', args: '<on|off>' },
  { command: '/wol', description: 'Wake a device via Wake-on-LAN', args: '<device_name>' },
];

// ─── Voice Waveform Visualizer ──────────────────────────────────────────────

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
        const height = Math.max(3, (normalizedVol / 100) * 28 * centerWeight * randomFactor);

        return (
          <motion.div
            key={i}
            animate={{ height }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className="w-[2px] rounded-full bg-offline-core/70"
            style={{
              boxShadow: normalizedVol > 30
                ? `0 0 ${Math.round(normalizedVol / 15)}px rgba(244, 244, 245, ${normalizedVol / 300})`
                : 'none',
            }}
          />
        );
      })}
    </motion.div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

interface AttachedFile {
  id: string;
  path: string;
  name: string;
}

export const OfflinePromptBar = ({ input, setInput, onSend, disabled }: Props) => {
  const { status, transcript, startListening, stopListening } = useVoice();
  const volume = useNeuralFrequency(status === 'LISTENING');
  const lastProcessedTranscript = useRef('');
  const wasListening = useRef(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [promptTokens, setPromptTokens] = useState<number>(0);
  const [isCalculatingTokens, setIsCalculatingTokens] = useState(false);
  const tokenDebounceRef = useRef<any>(null);

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

  const handleSendClick = () => {
    const paths = attachedFiles.map(f => f.path);
    onSend(undefined, paths);
    setAttachedFiles([]); // Clear attachments
    setPromptTokens(0); // Clear tokens count
    setIsCalculatingTokens(false);
  };

  // ── Voice transcript handling ──
  useEffect(() => {
    if (status === 'LISTENING') {
      wasListening.current = true;
    }
  }, [status]);

  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript.current) {
      setInput(transcript);
      lastProcessedTranscript.current = transcript;
      
      if (wasListening.current) {
        const paths = attachedFiles.map(f => f.path);
        onSend(transcript, paths);
        setAttachedFiles([]);
        wasListening.current = false;
      }
    }
  }, [transcript, setInput, onSend, attachedFiles]);

  // ── Slash command filtering ──
  const slashQuery = useMemo(() => {
    if (!input.startsWith('/')) return '';
    return input.split(' ')[0].toLowerCase();
  }, [input]);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return [];
    return SLASH_COMMANDS.filter(cmd => cmd.command.startsWith(slashQuery));
  }, [slashQuery]);

  useEffect(() => {
    if (slashQuery && filteredCommands.length > 0) {
      setShowSlashMenu(true);
      setSelectedSlashIdx(0);
    } else {
      setShowSlashMenu(false);
    }
  }, [slashQuery, filteredCommands.length]);

  const selectSlashCommand = (cmd: string) => {
    setInput(cmd + ' ');
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  // ── Key handling ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Slash menu navigation
    if (showSlashMenu && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIdx(prev => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIdx(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        selectSlashCommand(filteredCommands[selectedSlashIdx].command);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

    // Normal send
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && (input.trim() || attachedFiles.length > 0)) {
        handleSendClick();
      }
    }
  };

  return (
    <div className={`w-full bg-offline-bg border-t border-offline-border/40 pt-8 pb-8 px-4 transition-opacity duration-500 ${disabled ? 'opacity-80' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto relative group">

        {/* ── Slash Command Autocomplete Popup ── */}
        <AnimatePresence>
          {showSlashMenu && filteredCommands.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 left-0 w-full max-w-md bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] overflow-hidden z-50"
            >
              <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                <Command size={10} className="text-offline-core/60" />
                <span className="text-[9px] font-mono text-offline-core/50 uppercase tracking-[0.2em]">Local_Commands</span>
              </div>
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.command}
                  onMouseDown={() => selectSlashCommand(cmd.command)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-4 transition-all duration-150 border-l-2
                    ${idx === selectedSlashIdx
                      ? 'bg-offline-core/5 border-l-offline-core text-white'
                      : 'border-l-transparent text-secondary-txt hover:bg-white/[0.03]'
                    }`}
                >
                  <span className="font-mono text-[13px] font-bold text-offline-core shrink-0">{cmd.command}</span>
                  {cmd.args && <span className="font-mono text-[10px] text-tertiary-txt/60">{cmd.args}</span>}
                  <span className="text-[11px] font-sans text-secondary-txt/60 ml-auto">{cmd.description}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Input Container ── */}
        <div className={`relative bg-offline-surface border rounded-2xl p-4 shadow-2xl transition-all duration-300
          ${disabled 
            ? 'border-offline-core/10 grayscale-[0.5]' 
            : 'border-offline-border focus-within:border-offline-core/50 focus-within:shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.08)] focus-within:ring-1 focus-within:ring-offline-core/30'
          }`}
        >
          {/* Attached Files List */}
          <AnimatePresence>
            {attachedFiles.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 pb-3 mb-2 border-b border-white/5"
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

          {/* ── Inline Voice Waveform (replaces textarea when LISTENING) ── */}
          <AnimatePresence mode="wait">
            {status === 'LISTENING' ? (
              <motion.div
                key="waveform"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center h-14 pr-[150px]"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-offline-core shadow-[0_0_8px_var(--color-offline-core)] animate-pulse" />
                    <span className="text-[10px] font-mono text-offline-core uppercase tracking-[0.2em] animate-pulse whitespace-nowrap">
                      Listening
                    </span>
                  </div>
                  <VoiceWaveform volume={volume} />
                </div>
              </motion.div>
            ) : (
              <motion.div key="textarea" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <textarea
                  ref={textareaRef}
                  autoFocus
                  value={input}
                  readOnly={disabled} 
                  onChange={(e) => {
                    handleInputChange(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    status === 'WAKING'
                    ? "INITIALIZING_VOICE_MODEL..."
                    : disabled 
                    ? "JARVIS_IS_THINKING..." 
                    : "Execute local command... (type / for commands)"
                  }
                  className={`w-full bg-transparent border-none focus:outline-none text-[15px] font-sans resize-none h-14 pr-[150px] text-primary-txt placeholder:text-tertiary-txt transition-colors
                    ${disabled ? 'text-offline-core/40' : 'text-primary-txt'}
                  `}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* --- RIGHT ACTIONS: VOICE & SEND --- */}
          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            
            {/* Document Attachment Button */}
            <button 
              type="button"
              onClick={handleAttachClick}
              disabled={disabled}
              title="Attach document (.txt, .md, .pdf)"
              className="p-3 rounded-xl bg-white/5 text-secondary-txt hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(0,0,0,0.1)] cursor-pointer"
            >
              <Paperclip size={20} />
            </button>

            {/* Voice Activation Toggle */}
            <button 
              onClick={() => status === 'IDLE' ? startListening() : stopListening()}
              disabled={(disabled && status === 'IDLE') || status === 'WAKING'}
              title={status === 'IDLE' ? "Initialize Voice Uplink" : status === 'WAKING' ? "Waking voice model..." : "Terminate Uplink"}
              className={`p-3 rounded-xl transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.1)]
                ${status === 'LISTENING' 
                  ? 'bg-offline-core text-offline-bg hover:bg-offline-core/80 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.5)]' 
                  : status === 'WAKING'
                  ? 'bg-offline-core/20 text-offline-core animate-pulse cursor-wait'
                  : 'bg-white/5 text-secondary-txt hover:bg-white/10 hover:text-white'
                }`}
            >
              {status === 'WAKING' ? <Loader2 size={20} className="animate-spin" /> : status !== 'IDLE' ? <X size={18} /> : <Mic size={18} />}
            </button>
 
            {/* Manual Send / Loading Indicator */}
            <button 
              onClick={handleSendClick}
              disabled={disabled || (!input.trim() && attachedFiles.length === 0)}
              title="Execute Command"
              className="p-3 rounded-xl bg-offline-core text-offline-bg hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.3)] cursor-pointer"
            >
              {disabled ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </div>

        {/* Technical Footer Labels */}
        <div className="mt-4 flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-offline-core opacity-40 uppercase tracking-widest">
            <Shield size={10} /> {disabled ? 'NEURAL_LOCK_ACTIVE' : 'Local_Node_Only'}
            {input.trim() && (
              <span className="text-offline-core/60 ml-3 border border-offline-core/20 px-1.5 py-0.5 rounded bg-offline-core/5 min-w-[120px] inline-flex items-center gap-1 justify-center">
                PROMPT_TOKENS: {isCalculatingTokens ? <span className="animate-pulse">...</span> : promptTokens}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {status === 'LISTENING' && (
              <span className="text-[9px] font-mono text-offline-core animate-pulse uppercase tracking-[0.2em]">
                MIC_LIVE
              </span>
            )}
            <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.4em]">
              Neural_Bypass_v2.4
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};