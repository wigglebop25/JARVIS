import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Globe, Power } from 'lucide-react';

interface Props {
  target: 'online' | 'offline' | 'selection';
  onComplete: () => void;
}

export const ModeSwitchTransition = ({ target, onComplete }: Props) => {
  const [progress, setProgress] = useState(0);
  const [logLines, setLogLines] = useState<string[]>([]);

  const isOffline = target === 'offline';
  const isOnline = target === 'online';
  const isSelection = target === 'selection';

  // Define accent colors matching the main app stylesheets
  const accentColor = isOffline 
    ? 'var(--color-offline-core)' 
    : isSelection 
    ? '#FFAA00' // Amber alert color for shutdown/reset
    : '#00F0FF'; // Jarvis blue for online

  const accentColorRgb = isOffline 
    ? '244, 244, 245' 
    : isSelection 
    ? '255, 170, 0' 
    : '0, 240, 255';

  const logs = {
    online: [
      '[  0.05 ] INIT_CLOUD_BRIDGE: Connecting to master network...',
      '[  0.45 ] DNS_RESOLVED: Routing to secure cloud gateway...',
      '[  0.90 ] AUTH_TOKEN_VALID: Authentication handshake complete...',
      '[  1.40 ] MCP_SYNC: Fetching remote tool configurations...',
      '[  1.85 ] NEURAL_UPLINK: Synced via WebSockets. Latency: 24ms...',
      '[  2.30 ] BOOT_SUCCESS: Sync Mode initialized.'
    ],
    offline: [
      '[  0.05 ] SEVERING_TETHER: Closing cloud integration sockets...',
      '[  0.50 ] DEACTIVATING: External network bindings closed.',
      '[  1.10 ] LOCAL_LLM: Locating local node loopbacks (127.0.0.1)...',
      '[  1.60 ] VOICE_MODEL: Loading parakeet-tdt-0.6b-v3 parameters...',
      '[  2.15 ] AIRGAP_FIREWALL: Enforcing strict local sandbox rules.',
      '[  2.50 ] BOOT_SUCCESS: Secure Local Node active.'
    ],
    selection: [
      '[  0.05 ] DECONFIGURING_CORE: Terminating active session threads...',
      '[  0.60 ] SAVING_STATE: Backing up configuration cache...',
      '[  1.20 ] CORE_REBOOT: Revoking credentials on active socket...',
      '[  1.90 ] TERMINATING: Shutting down current UI console...',
      '[  2.40 ] BOOT_SUCCESS: Returning to selection protocol.'
    ]
  };

  const activeLogs = logs[target];

  useEffect(() => {
    // 1. Progress Bar Fill-up
    const duration = 2800; // 2.8 seconds total
    const start = performance.now();

    const updateProgress = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      } else {
        setProgress(100);
        setTimeout(onComplete, 200); // Small pause at 100%
      }
    };
    
    requestAnimationFrame(updateProgress);

    // 2. Sequential Log Output
    const timeouts: NodeJS.Timeout[] = [];
    activeLogs.forEach((line, index) => {
      const timeMs = index * 420; // Stagger printouts
      const t = setTimeout(() => {
        setLogLines(prev => [...prev, line]);
      }, timeMs);
      timeouts.push(t);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [target, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between p-12 select-none font-mono"
      style={{
        '--transition-accent': accentColor,
        '--transition-accent-rgb': accentColorRgb
      } as React.CSSProperties}
    >
      {/* ── Visual Scanning / Glitch Layers ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Grids */}
        <div className="grid-overlay opacity-30" />
        
        {/* Sweeping CRT Scanline */}
        <motion.div
          animate={{ y: ['-10vh', '110vh'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-x-0 h-[2px] bg-[var(--transition-accent)]/20 shadow-[0_0_10px_var(--transition-accent)] opacity-60"
        />

        {/* Dynamic Static Flits */}
        <motion.div
          animate={{ opacity: [0.02, 0.05, 0.01, 0.03, 0.02] }}
          transition={{ duration: 0.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(rgba(var(--transition-accent-rgb),0.02)_1px,transparent_0%)] bg-[length:4px_4px]"
        />
      </div>

      {/* ── TOP SECTION: Mode Headers & Security State ── */}
      <div className="flex justify-between items-start z-10">
        <div className="space-y-2">
          <div className="text-[10px] text-white/40 tracking-[0.4em] uppercase">SYSTEM_STATE_TRANSITION</div>
          <h2 
            className="text-lg font-bold uppercase tracking-wider flex items-center gap-3"
            style={{ color: accentColor }}
          >
            {isOffline && (
              <>
                <Shield className="animate-pulse" size={20} />
                ENACTING_LOCAL_AIRGAP_PROTOCOL
              </>
            )}
            {isOnline && (
              <>
                <Globe className="animate-pulse" size={20} />
                ESTABLISHING_NEURAL_UPLINK
              </>
            )}
            {isSelection && (
              <>
                <Power className="animate-pulse" size={20} />
                REBOOTING_OPERATING_SYSTEM
              </>
            )}
          </h2>
        </div>
        <div className="text-right space-y-1">
          <div className="text-[9px] text-white/30 tracking-[0.2em]">HOST_INTEGRITY</div>
          <div className="text-xs text-white/70">SECURE_VERIFIED</div>
        </div>
      </div>

      {/* ── CENTER SECTION: Monospace Console Logs ── */}
      <div className="flex-1 my-10 max-w-3xl w-full mx-auto flex flex-col justify-center gap-3 overflow-hidden border border-white/5 bg-white/[0.01] p-6 rounded-lg shadow-2xl relative z-10">
        <div className="absolute top-2 left-3 text-[8px] text-white/20 tracking-widest uppercase">Console_Output</div>
        <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar flex flex-col justify-start">
          <AnimatePresence>
            {logLines.map((line, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15 }}
                className={`text-xs leading-relaxed font-mono ${
                  line.includes('BOOT_SUCCESS') 
                    ? 'text-white font-bold tracking-wider' 
                    : 'text-white/60'
                }`}
              >
                {line.includes('BOOT_SUCCESS') ? (
                  <span style={{ color: accentColor }}>{line}</span>
                ) : (
                  line
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ── BOTTOM SECTION: Progress Status Indicator ── */}
      <div className="space-y-4 max-w-5xl mx-auto w-full z-10">
        <div className="flex justify-between items-end text-[10px] text-white/50 tracking-wider">
          <span className="uppercase">
            {isOffline && 'Locking hardware interfaces...'}
            {isOnline && 'Syncing cloud settings & agents...'}
            {isSelection && 'Recalibrating mode protocol...'}
          </span>
          <span className="font-bold text-xs" style={{ color: accentColor }}>
            {Math.round(progress)}%
          </span>
        </div>

        {/* loading bar container */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner relative">
          <div 
            className="h-full rounded-full transition-all duration-75 relative"
            style={{ 
              width: `${progress}%`,
              backgroundColor: accentColor,
              boxShadow: `0 0 12px ${accentColor}`
            }}
          />
        </div>

        <div className="flex justify-between items-center text-[8px] text-white/20 tracking-[0.3em]">
          <span>CORE_NODE: JRV_X1</span>
          <span>TRANSITION_UPLINK_STATUS: NOMINAL</span>
        </div>
      </div>
    </motion.div>
  );
};
