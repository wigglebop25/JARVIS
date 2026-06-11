import { Shield, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { VoiceStatusOrb } from '@/features/chat'; 

const MotionShield = motion(Shield);

export const OfflineTitlebar = () => {
  const { systemInfo } = useSystemInfo();
  const formattedTime = systemInfo 
    ? new Date(systemInfo.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <header 
      data-tauri-drag-region 
      className="h-14 w-full bg-offline-surface-dark border-b border-offline-border flex items-center justify-between px-6 select-none z-50 relative overflow-hidden"
    >
      {/* Visual Subsurface Glow */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-offline-core/5 via-transparent to-offline-core/5" />

      {/* Left: Mode & Identity */}
      <div className="flex items-center gap-6 z-10">
        <div id="airgap-badge" className="flex items-center gap-2.5 px-3 ml-5 py-1 bg-offline-core/10 border border-offline-core/30 rounded-md shadow-[0_0_10px_rgba(var(--color-offline-core-rgb),0.1)]">
          <MotionShield 
            size={14} 
            className="text-offline-core"
            animate={{ 
              opacity: [0.4, 1, 0.4],
              scale: [0.95, 1.05, 0.95]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span className="font-mono text-xs text-offline-core tracking-[0.15em] font-bold">
            LOCAL_AIRGAP
          </span>
        </div>
      </div>
      
      {/* Center: System Telemetry Animation (Fills negative space) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4 z-10 pointer-events-none">
        {/* Animated Scan Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded font-mono text-[10px] text-offline-core/55 tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-offline-core/50 animate-ping" />
          SYS_SECURE: <span className="text-offline-core font-bold animate-pulse">ACTIVE_SHIELD</span>
        </div>
        
        {/* Animated Telemetry Frequency Wave */}
        <div className="flex items-end gap-[3px] h-4">
          {[0.6, 0.4, 0.9, 0.3, 0.7, 0.5, 0.8, 0.4, 0.6, 0.3, 0.5, 0.9, 0.4, 0.7, 0.5].map((multiplier, idx) => (
            <motion.div
              key={idx}
              animate={{ 
                height: [
                  `${multiplier * 4}px`, 
                  `${multiplier * 14}px`, 
                  `${multiplier * 4}px`
                ] 
              }}
              transition={{
                duration: 1.0 + idx * 0.12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-[2px] bg-offline-core/35 rounded-t"
            />
          ))}
        </div>

        <div className="text-[10px] font-mono text-offline-core/40 tracking-widest hidden xl:block uppercase">
          // AIR_LINK_SECURE_MODE_01
        </div>
      </div>
      
      {/* Right: Telemetry, Time & Profile */}
      <div className="flex items-center gap-6 z-10">
        {/* NEURAL CORE: Integrated Visualizer */}
        <div className="h-10 w-20 flex items-center justify-center">
          <div className="scale-[0.4] origin-center">
            <VoiceStatusOrb />
          </div>
        </div>

        <div className="text-xs font-mono text-primary-txt uppercase tracking-tight border-l border-white/5 pl-6 hidden sm:block">
          <span className="text-secondary-txt opacity-50 mr-2">TIME:</span>
          {formattedTime}
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded hover:border-offline-core/40 transition-all cursor-help group hidden md:flex">
          <Lock size={14} className="text-offline-core/80 group-hover:animate-bounce" />
          <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">
            SECURE_HASH
          </span>
        </div>
        
        {/* Profile Avatar (Square Technical Style) */}
        <div className="w-9 h-9 bg-offline-surface border border-offline-border flex items-center justify-center text-xs font-mono text-offline-core hover:bg-offline-core hover:text-offline-bg transition-all duration-300 cursor-pointer shadow-inner font-bold">
          {systemInfo ? systemInfo.username.substring(0, 1).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};