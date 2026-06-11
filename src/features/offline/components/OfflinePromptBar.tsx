import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Shield, Loader2, Mic, X, Paperclip } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useNeuralFrequency } from '@/hooks/useNeuralFrequency';
import { VoiceWaveform, AttachedFileChips, SlashCommandMenu, useFileAttachments, useTokenCount } from '@/features/prompt';

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: (overrideText?: string, attachments?: string[]) => void;
  disabled?: boolean;
  centered?: boolean;
}

export const OfflinePromptBar = ({ input, setInput, onSend, disabled, centered = false }: Props) => {
  const { status, transcript, startListening, stopListening } = useVoice();
  const volume = useNeuralFrequency(status === 'LISTENING');
  const wasListening = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastProcessedTranscript = useRef('');

  const { files: attachedFiles, add: handleAttachClick, remove: removeFile, clear: clearFiles } = useFileAttachments();
  const attachedFilesRef = useRef(attachedFiles);
  attachedFilesRef.current = attachedFiles;
  const { tokens: promptTokens, isCalculating: isCalculatingTokens, update: updateTokenCount } = useTokenCount();

  const handleInputChange = (val: string) => {
    setInput(val);
    updateTokenCount(val);
  };

  const handleSendClick = () => {
    const paths = attachedFiles.map(f => f.path);
    onSend(undefined, paths);
    clearFiles();
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
        const paths = attachedFilesRef.current.map(f => f.path);
        onSend(transcript, paths);
        clearFiles();
        wasListening.current = false;
      }
    }
  }, [transcript, setInput, onSend]);

  const selectSlashCommand = useCallback((cmd: string) => {
    setInput(cmd + ' ');
    textareaRef.current?.focus();
  }, [setInput]);

  // ── Key handling ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && (input.trim() || attachedFiles.length > 0)) {
        handleSendClick();
      }
    }
  };

  return (
    <motion.div 
      layout
      transition={{ type: "spring", stiffness: 220, damping: 25 }}
      className={`w-full transition-all duration-500 ${centered ? 'pt-2 pb-2 px-0 bg-transparent' : 'bg-offline-bg pt-4 pb-4 px-4'} ${disabled ? 'opacity-80' : 'opacity-100'}`}
    >
      <div className="max-w-5xl mx-auto relative group">

        {/* ── Slash Command Autocomplete Popup ── */}
        <SlashCommandMenu input={input} onSelect={selectSlashCommand} />

        {/* ── Input Container ── */}
        <motion.div 
          layout
          transition={{ type: "spring", stiffness: 220, damping: 25 }}
          className={`relative bg-offline-surface border rounded-2xl p-4 shadow-2xl transition-all duration-300
            ${disabled 
              ? 'border-offline-core/10 grayscale-[0.5]' 
              : 'border-offline-border focus-within:border-offline-core/50 focus-within:shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.08)] focus-within:ring-1 focus-within:ring-offline-core/30'
            }`}
        >
          {/* Attached Files List */}
          <AttachedFileChips files={attachedFiles} onRemove={removeFile} />

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
                  <VoiceWaveform volume={volume} barColor="bg-offline-core/70" maxHeight={28} />
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
        </motion.div>

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
    </motion.div>
  );
};
