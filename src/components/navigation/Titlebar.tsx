import { Search, Activity, Mic, MicOff } from 'lucide-react';
import { useState } from 'react';
import { MOCK_SYSTEM_UTILITIES } from '@/lib/mockData';
import { NeuralCore } from '@/features/mcp/components/NeuralCore';
import { useVoice } from '@/hooks/useVoice';

export const Titlebar = () => {
  const { isListening, transcript, startListening, stopListening } = useVoice();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
  }

  useState(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  });

  return (
    <header 
      data-tauri-drag-region 
      className="h-15 w-full bg-surface-1/50 backdrop-blur-lg border-b border-white/5 flex items-center justify-between px-6 select-none z-20 relative"
    >
      {/* LEFT: Mode & Identity */}
      <div className="flex items-center gap-6">
        <div className="font-sans text-sm tracking-widest font-bold text-secondary-txt pointer-events-none uppercase">
          <span className="text-jarvis-blue">JARVIS</span>_OS
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-jarvis-blue/5 border border-jarvis-blue/20 rounded-md">
            <Activity size={12} className="text-jarvis-blue animate-pulse" />
            <span className="text-[10px] font-mono text-jarvis-blue/80 uppercase tracking-tighter">Uplink_Established</span>
          </div>
          
          {transcript && (
            <div className="text-[10px] font-mono text-success-green animate-in fade-in slide-in-from-left-2">
              RESULT: "{transcript}"
            </div>
          )}
        </div>
      </div>
      
      {/* CENTER: System Display & Neural Pulse */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="text-tertiary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none">
            BATTERY: <span className="text-success-green font-bold">{MOCK_SYSTEM_UTILITIES.batteryData}%</span>
          </div>
          <div className="text-primary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none border-l border-white/10 pl-4 min-w-[100px]">
            <span className="text-tertiary-txt">TIME: </span>{currentTime}
          </div>
        </div>

        {/* NEURAL CORE: Scaled to fit titlebar height */}
        <div className="h-10 w-20 flex items-center justify-center border-x border-white/5 px-4">
          <div className="scale-[0.4] origin-center">
            <NeuralCore />
          </div>
        </div>
      </div>
      
      {/* RIGHT: Search & User */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center group">
          <Search size={14} className="absolute left-3 text-tertiary-txt pointer-events-none group-focus-within:text-jarvis-blue transition-colors" />
          <input 
            className="bg-surface-3/30 backdrop-blur-sm pl-9 text-primary-txt text-sm font-sans rounded-full w-48 focus:w-64 py-1.5 focus:outline-none focus:ring-1 focus:ring-jarvis-blue/50 transition-all border border-white/5 focus:border-jarvis-blue/50 placeholder:text-tertiary-txt/50"
            type='text'
            placeholder='COMMAND_SEARCH...'
            value={searchTerm}
            onChange={onChange}
          />
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
           <div className="rounded-full bg-jarvis-blue/10 border border-jarvis-blue/30 w-8 h-8 flex items-center justify-center text-xs font-mono text-jarvis-blue shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:bg-jarvis-blue hover:text-base transition-all duration-300 cursor-pointer">
            S
          </div>
        </div>
      </div>
    </header>
  );
};