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

  // 🧠 Logic: Sync real-time transcript to the input field
  useEffect(() => {
    if (status === 'LISTENING' && transcript) {
      setInput(transcript);
    }
  }, [status, transcript, setInput]);

  // 🧠 Logic: Auto-send when speaking finishes
  useEffect(() => {
    if (status === 'IDLE' && input.trim() !== '' && input !== lastProcessedTranscript.current) {
      onSend();
      lastProcessedTranscript.current = input;
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
    <div className={`w-full bg-offline-surface from-base via-base to-transparent pt-10 pb-8 px-4 transition-opacity duration-500 ${disabled ? 'opacity-80' : 'opacity-100'}`}>
      <div className="max-w-5xl mx-auto relative group">
        <div className={`relative bg-surface-1/50 border rounded-2xl p-4 shadow-2xl transition-all 
          ${disabled 
            ? 'border-offline-core/10 grayscale-[0.5]' 
            : 'border-offline-border focus-within:border-offline-core/50 focus-within:bg-surface-1/80'
          }`}
        >
          <textarea
            autoFocus
            value={input}
            readOnly={disabled} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={status === 'LISTENING' ? "LISTENING_TO_OPERATOR..." : disabled ? "JARVIS_IS_THINKING..." : "Execute local MCP command..."}
            // Increased right padding (pr-[110px]) to prevent text from hiding behind the two buttons
            className={`w-full bg-transparent border-none focus:outline-none text-sm font-mono resize-none h-14 pr-[110px] text-primary-txt placeholder:text-tertiary-txt transition-colors
              ${disabled ? 'text-offline-core/40' : 'text-primary-txt'}
            `}
          />
          
          {/* --- RIGHT ACTIONS: VOICE & SEND --- */}
          <div className="absolute right-4 bottom-4 flex items-center gap-2">
            
            {/* Voice Activation Toggle */}
            <button 
              onClick={() => status === 'IDLE' ? startListening() : stopListening()}
              disabled={disabled && status === 'IDLE'} // Cannot start voice while disabled, but CAN stop it
              title={status === 'IDLE' ? "Initialize Voice Uplink" : "Terminate Uplink"}
              className={`p-3 rounded-xl transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.1)]
                ${status !== 'IDLE' 
                  ? 'bg-offline-core text-base hover:bg-offline-core/80 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.5)]' 
                  : 'bg-surface-3/50 text-secondary-txt hover:bg-white/10 hover:text-white'
                }`}
            >
              {status !== 'IDLE' ? <X size={20} /> : <Mic size={20} />}
            </button>

            {/* Manual Send / Loading Indicator */}
            <button 
              onClick={onSend}
              disabled={disabled || !input.trim()}
              title="Execute Command"
              className="p-3 rounded-xl bg-offline-core text-base hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(var(--color-offline-core-rgb),0.3)]"
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