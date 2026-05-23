import React, { useEffect, useRef } from 'react';
import { Send, Shield, Loader2, Mic, X } from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export const OfflinePromptBar = ({ input, setInput, onSend, disabled }: Props) => {
  const { status, transcript, startListening, stopListening } = useVoice();
  const lastProcessedTranscript = useRef('');
  const isVoiceInput = useRef(false);

  useEffect(() => {
    if (status === 'LISTENING' && transcript) {
      setInput(transcript);
      isVoiceInput.current = true;
    }
  }, [status, transcript, setInput]);

  // 🧠 Logic: Auto-send when speaking finishes
  useEffect(() => {
    if (status === 'IDLE' && input.trim() !== '' && isVoiceInput.current && input !== lastProcessedTranscript.current) {
      onSend();
      lastProcessedTranscript.current = input;
      isVoiceInput.current = false;
    }
    // Reset the ref when a new listening session starts
    if (status === 'LISTENING') {
      lastProcessedTranscript.current = '';
    }
  }, [status, input, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className={`w-full bg-offline-bg border-t border-offline-border/40 pt-8 pb-8 px-4 transition-opacity duration-500 ${disabled ? 'opacity-80' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto relative group">
        <div className={`relative bg-offline-surface border rounded-2xl p-4 shadow-2xl transition-all duration-300
          ${disabled 
            ? 'border-offline-core/10 grayscale-[0.5]' 
            : 'border-offline-border focus-within:border-offline-core/50 focus-within:shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.08)] focus-within:ring-1 focus-within:ring-offline-core/30'
          }`}
        >
          <textarea
            autoFocus
            value={input}
            readOnly={disabled} 
            onChange={(e) => {
              isVoiceInput.current = false;
              setInput(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              status === 'LISTENING' 
                ? "LISTENING_TO_OPERATOR..." 
                : status === 'WAKING'
                ? "INITIALIZING_VOICE_MODEL..."
                : disabled 
                ? "JARVIS_IS_THINKING..." 
                : "Execute local MCP command..."
            }
            // Increased right padding (pr-[110px]) to prevent text from hiding behind the two buttons
            className={`w-full bg-transparent border-none focus:outline-none text-[15px] font-sans resize-none h-14 pr-[110px] text-primary-txt placeholder:text-tertiary-txt transition-colors
              ${disabled ? 'text-offline-core/40' : 'text-primary-txt'}
            `}
          />
          
          {/* --- RIGHT ACTIONS: VOICE & SEND --- */}
          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            
            {/* Voice Activation Toggle */}
            <button 
              onClick={() => status === 'IDLE' ? startListening() : stopListening()}
              disabled={(disabled && status === 'IDLE') || status === 'WAKING'} // Disable clicks during waking initialization
              title={status === 'IDLE' ? "Initialize Voice Uplink" : status === 'WAKING' ? "Waking voice model..." : "Terminate Uplink"}
              className={`p-3 rounded-xl transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.1)]
                ${status === 'LISTENING' 
                  ? 'bg-offline-core text-offline-bg hover:bg-offline-core/80 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.5)]' 
                  : status === 'WAKING'
                  ? 'bg-offline-core/20 text-offline-core animate-pulse cursor-wait'
                  : 'bg-white/5 text-secondary-txt hover:bg-white/10 hover:text-white'
                }`}
            >
              {status === 'WAKING' ? <Loader2 size={20} className="animate-spin" /> : status !== 'IDLE' ? <X size={20} /> : <Mic size={20} />}
            </button>
 
            {/* Manual Send / Loading Indicator */}
            <button 
              onClick={onSend}
              disabled={disabled || !input.trim()}
              title="Execute Command"
              className="p-3 rounded-xl bg-offline-core text-offline-bg hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.3)]"
            >
              {disabled ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>

        {/* Technical Footer Labels */}
        <div className="mt-4 flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-offline-core opacity-40 uppercase tracking-widest">
            <Shield size={10} /> {disabled ? 'NEURAL_LOCK_ACTIVE' : 'Local_Node_Only'}
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