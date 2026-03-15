import {Search} from 'lucide-react';
import { useState} from 'react';
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
      className="h-15 w-full bg-surface-1 border-b border-surface-3 flex items-center justify-between px-4 select-none"
    >
      {/* Navigation Button (Left) */}

      {/* Left Title */}
      <div className="ml-5 font-mono text-sm text-secondary-txt pointer-events-none">
        <span className="text-primary-txt">JARVIS</span> AI
      </div>
      {/* System Display (Center) */}
      <div className="flex items-center gap-3">
        <div className="text-tertiary-txt text-sm font-mono">
          Battery: <span className="text-green-600">{MOCK_SYSTEM_UTILITIES.batteryData}%</span>
        </div>
          {/* Time Display */}
        <div className="text-primary-txt text-sm font-mono">
          <span className="text-tertiary-txt">Time: </span>{MOCK_SYSTEM_UTILITIES.timeData}
        </div>
      </div>
        {/* Search / Profile (Right) */}
      <div className="flex items-center gap-3">
        <div className="relative flex">
          <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-tertiary-txt" />
          <input 
          className="bg-surface-3 pl-9 text-secondary-txt text-sm font-mono rounded-3xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-jarvis-blue focus:ring-offset-1 focus:ring-offset-surface-1 transition-colors"
          type='text'
          placeholder='Search'
          value={searchTerm}
          onChange={onChange}
          />
        </div>
        
        <div className="rounded-4xl bg-white w-8 h-8 flex items-center justify-center text-sm font-mono text-secondary-txt">

        </div>
      </div>

    </header>
  );
};