import { Shield, HardDrive, Cpu, Lock } from 'lucide-react';
import { MOCK_SYSTEM_UTILITIES } from '@/lib/mockData';
import { NeuralCore } from '@/features/mcp/components/NeuralCore'; 

export const OfflineTitlebar = () => {
  return (
    <header 
      data-tauri-drag-region 
      className="h-14 w-full bg-offline-bg border-b border-offline-border flex items-center justify-between px-6 select-none z-50 relative overflow-hidden"
    >
      {/* Visual Subsurface Glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-offline-core/5 via-transparent to-offline-core/5" />

      {/* Left: Mode & Identity */}
      <div className="flex items-center gap-6 z-10">
        <div className="flex items-center gap-2.5 px-3 ml-5 py-1 bg-offline-core/10 border border-offline-core/30 rounded-md shadow-[0_0_10px_rgba(var(--color-offline-core-rgb),0.1)]">
          <Shield size={14} className="text-offline-core animate-pulse" />
          <span className="font-mono text-xs text-offline-core tracking-[0.15em] font-bold">
            LOCAL_AIRGAP
          </span>
        </div>
        <div className="font-mono text-xs text-secondary-txt opacity-50 uppercase tracking-wider hidden md:block">
          <span className="text-primary-txt">JARVIS-SECURE-01</span>
        </div>
      </div>
      
      {/* Center-Right: Telemetry & Neural Core */}
      <div className="flex items-center gap-8 z-10">
        <div className="flex items-center gap-6 border-r border-white/5 pr-6">
          <div className="flex items-center gap-2.5 group">
            <HardDrive size={14} className="text-offline-core/60 group-hover:text-offline-core transition-colors" />
            <div className="text-xs font-mono text-secondary-txt uppercase">
              Disk <span className="text-primary-txt ml-1 font-bold">84%</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 group">
            <Cpu size={14} className="text-offline-core/60 group-hover:text-offline-core transition-colors" />
            <div className="text-xs font-mono text-secondary-txt uppercase">
              Temp <span className="text-primary-txt ml-1 font-bold">24.2°C</span>
            </div>
          </div>
        </div>

        {/* NEURAL CORE: Integrated Visualizer */}
        <div className="h-10 w-20 flex items-center justify-center">
          <div className="scale-[0.4] origin-center">
            <NeuralCore />
          </div>
        </div>

        <div className="text-xs font-mono text-primary-txt uppercase tracking-tight border-l border-white/5 pl-6">
          <span className="text-secondary-txt opacity-50 mr-2">TIME:</span>
          {MOCK_SYSTEM_UTILITIES.timeData}
        </div>
      </div>
      
      {/* Right: Security & Admin */}
      <div className="flex items-center gap-5 z-10">
        {/* Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded hover:border-offline-core/40 transition-all cursor-help group">
          <Lock size={14} className="text-offline-core/80 group-hover:animate-bounce" />
          <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
            SECURE_HASH
          </span>
        </div>
        
        {/* Profile Avatar (Square Technical Style) */}
        <div className="w-9 h-9 bg-offline-surface border border-offline-border flex items-center justify-center text-xs font-mono text-offline-core hover:bg-offline-core hover:text-offline-bg transition-all duration-300 cursor-pointer shadow-inner font-bold">
          S
        </div>
      </div>
    </header>
  );
};