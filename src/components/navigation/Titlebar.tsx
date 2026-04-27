import { Search } from 'lucide-react';
import { useState } from 'react';
import { MOCK_SYSTEM_UTILITIES } from '@/lib/mockData';

export const Titlebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTerm(e.target.value);
    console.log('Search input:', e.target.value);
  }

  return (
    <header 
      data-tauri-drag-region 
      className="h-15 w-full bg-surface-1/50 backdrop-blur-lg border-b border-white/5 flex items-center justify-between px-4 select-none z-20 relative"
    >
      {/* Left Title */}
      <div className="ml-5 font-mono text-sm text-secondary-txt pointer-events-none">
        <span className="text-primary-txt">JARVIS</span> AI
      </div>
      
      {/* System Display (Center) */}
      <div className="flex items-center gap-3">
        <div className="text-tertiary-txt text-sm font-mono pointer-events-none">
          Battery: <span className="text-success-green">{MOCK_SYSTEM_UTILITIES.batteryData}%</span>
        </div>
        {/* Time Display */}
        <div className="text-primary-txt text-sm font-mono pointer-events-none">
          <span className="text-tertiary-txt">Time: </span>{MOCK_SYSTEM_UTILITIES.timeData}
        </div>
      </div>
      
      {/* Search / Profile (Right) */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-tertiary-txt pointer-events-none" />
          <input 
            className="bg-surface-3/50 backdrop-blur-sm pl-9 text-primary-txt text-sm font-mono rounded-3xl px-4 py-1.5 focus:outline-none focus:ring-1 focus:ring-jarvis-blue focus:ring-offset-1 focus:ring-offset-transparent transition-all border border-transparent focus:border-jarvis-blue/50 placeholder:text-tertiary-txt"
            type='text'
            placeholder='Search SYSTEM...'
            value={searchTerm}
            onChange={onChange}
          />
        </div>
        
        {/* Profile Avatar Placeholder */}
        <div className="rounded-full bg-surface-3/50 border border-white/10 w-8 h-8 flex items-center justify-center text-sm font-mono text-primary-txt shadow-sm hover:bg-surface-3 transition-colors cursor-pointer">
          S
        </div>
      </div>

    </header>
  );
};