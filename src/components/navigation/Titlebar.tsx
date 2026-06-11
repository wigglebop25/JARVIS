import { Search, Activity } from 'lucide-react';
import { useState } from 'react';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { VoiceStatusOrb } from '@/features/chat';

export const Titlebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
  const { systemInfo } = useSystemInfo();

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
          <span className="text-theme-accent">JARVIS</span>_OS
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-theme-accent/5 border border-theme-accent/20 rounded-md">
            <Activity size={12} className="text-theme-accent animate-pulse" />
            <span className="text-[10px] font-mono text-theme-accent/80 uppercase tracking-tighter">Uplink_Established</span>
          </div>
        </div>
      </div>
      
      {/* CENTER: System Display & Neural Pulse */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="text-tertiary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none">
            DISK: <span className="text-success-green font-bold">{systemInfo ? Math.round(systemInfo.disk_usage) : '--'}%</span>
          </div>
          <div className="text-primary-txt text-[11px] font-mono uppercase tracking-tight pointer-events-none border-l border-white/10 pl-4 min-w-[100px]">
            <span className="text-tertiary-txt">TIME: </span>{currentTime}
          </div>
        </div>

        {/* NEURAL CORE: Scaled to fit titlebar height */}
        <div className="h-10 w-20 flex items-center justify-center border-x border-white/5 px-4">
          <div className="scale-[0.4] origin-center">
            <VoiceStatusOrb />
          </div>
        </div>
      </div>
      
      {/* RIGHT: Search & User */}
      <div className="flex items-center gap-4">
        <div className="relative flex items-center group">
          <Search size={14} className="absolute left-3 text-tertiary-txt pointer-events-none group-focus-within:text-theme-accent transition-colors" />
          <input 
            className="bg-surface-3/30 backdrop-blur-sm pl-9 text-primary-txt text-sm font-sans rounded-full w-48 focus:w-64 py-1.5 focus:outline-none focus:ring-1 focus:ring-theme-accent/50 transition-all border border-white/5 focus:border-theme-accent/50 placeholder:text-tertiary-txt/50"
            type='text'
            placeholder='COMMAND_SEARCH...'
            value={searchTerm}
            onChange={onChange}
          />
        </div>
        
        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/10">
           <div className="rounded-full bg-theme-accent/10 border border-theme-accent/30 w-8 h-8 flex items-center justify-center text-xs font-mono text-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.1)] hover:bg-theme-accent hover:text-black transition-all duration-300 cursor-pointer">
            {systemInfo ? systemInfo.username.substring(0, 2).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};