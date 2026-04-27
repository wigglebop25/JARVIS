import React from 'react';
import { Send, Shield, Loader2 } from 'lucide-react';

interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  disabled?: boolean; // Added the optional disabled prop
}

export const OfflinePromptBar = ({ input, setInput, onSend, disabled }: Props) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent sending if empty OR if the system is currently disabled (thinking)
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
            readOnly={disabled} // Prevent typing while thinking
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "JARVIS_IS_THINKING..." : "Execute local MCP command..."}
            className={`w-full bg-transparent border-none focus:outline-none text-sm font-mono resize-none h-14 pr-14 text-primary-txt placeholder:text-tertiary-txt transition-colors
              ${disabled ? 'text-offline-core/40' : 'text-primary-txt'}
            `}
          />
          
          <button 
            onClick={onSend}
            disabled={disabled || !input.trim()}
            className="absolute right-4 bottom-4 p-3 rounded-xl bg-offline-core text-base hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:grayscale disabled:hover:scale-100 shadow-[0_0_20px_rgba(14,165,233,0.3)]"
          >
            {disabled ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>

        {/* Technical Footer Labels */}
        <div className="mt-4 flex justify-between items-center px-2">
          <div className="flex items-center gap-2 text-[9px] font-mono text-offline-core opacity-40 uppercase tracking-widest">
            <Shield size={10} /> {disabled ? 'NEURAL_LOCK_ACTIVE' : 'Local_Node_Only'}
          </div>
          <div className="text-[8px] font-mono text-white/10 uppercase tracking-[0.4em]">
            Neural_Bypass_v2.4
          </div>
        </div>
      </div>
    </div>
  );
};