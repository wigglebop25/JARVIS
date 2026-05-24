import { useState, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Cpu, MemoryStick, Wifi, WifiOff, Bluetooth, BluetoothOff,
  Volume2, VolumeX, ChevronRight, ChevronLeft,
  Activity, HardDrive, X, GripVertical, ExternalLink
} from 'lucide-react';
import { useSystemInfo } from '@/hooks/useSystemInfo';

// ─── Telemetry Bar ──────────────────────────────────────────────────────────

const TelemetryBar = ({ label, value, icon, warning = false }: {
  label: string; value: number; icon: React.ReactNode; warning?: boolean;
}) => {
  const barColor = warning
    ? 'bg-gradient-to-r from-error-red/80 to-error-red'
    : 'bg-gradient-to-r from-offline-core/40 to-offline-core/80';
  const textColor = warning ? 'text-error-red' : 'text-offline-core';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-2 text-xs font-mono uppercase tracking-wider ${textColor}`}>
          {icon} <span className="text-secondary-txt/80">{label}</span>
        </span>
        <span className={`text-xs font-mono font-bold ${warning ? 'text-error-red animate-pulse' : 'text-primary-txt'}`}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${barColor} ${warning ? 'shadow-[0_0_8px_rgba(255,51,51,0.5)]' : 'shadow-[0_0_6px_rgba(244,244,245,0.15)]'}`}
        />
      </div>
    </div>
  );
};

// ─── Hardware Toggle ────────────────────────────────────────────────────────

const HardwareToggle = ({ label, enabled, onToggle, iconOn, iconOff }: {
  label: string; enabled: boolean; onToggle: () => void;
  iconOn: React.ReactNode; iconOff: React.ReactNode;
}) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border transition-all duration-300 group
      ${enabled
        ? 'bg-offline-core/5 border-offline-core/30 hover:bg-offline-core/10'
        : 'bg-white/[0.02] border-white/5 hover:border-white/15 opacity-50 hover:opacity-70'
      }`}
  >
    <div className={`transition-colors ${enabled ? 'text-offline-core' : 'text-secondary-txt/50'}`}>
      {enabled ? iconOn : iconOff}
    </div>
    <span className={`text-xs font-mono uppercase tracking-wider flex-1 text-left transition-colors
      ${enabled ? 'text-offline-core' : 'text-secondary-txt/55'}`}>
      {label}
    </span>
    {/* Mini toggle indicator */}
    <div className={`w-7 h-3.5 rounded-full relative transition-colors duration-300 border
      ${enabled ? 'bg-offline-core/20 border-offline-core/50' : 'bg-white/5 border-white/10'}`}>
      <motion.div
        animate={{ x: enabled ? 14 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`w-2.5 h-2.5 rounded-full absolute top-[1px] transition-colors duration-300
          ${enabled ? 'bg-offline-core shadow-[0_0_6px_var(--color-offline-core)]' : 'bg-secondary-txt/40'}`}
      />
    </div>
  </button>
);

// ─── Main Component ─────────────────────────────────────────────────────────

interface OfflineTelemetryHUDProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const OfflineTelemetryHUD = ({ isOpen, onToggle }: OfflineTelemetryHUDProps) => {
  const { systemInfo } = useSystemInfo();
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const cpuDragControls = useDragControls();
  const controlDragControls = useDragControls();

  const cpu = systemInfo ? Math.round(systemInfo.cpu_usage) : 0;
  const ram = systemInfo ? Math.round(systemInfo.ram_usage) : 0;
  const disk = systemInfo ? Math.round(systemInfo.disk_usage) : 0;
  const temp = systemInfo?.cpu_temperature ? Math.round(systemInfo.cpu_temperature) : 0;

  const [volume, setVolume] = useState(65);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [btEnabled, setBtEnabled] = useState(false);

  // Widget Detach States
  const [isCpuFloated, setIsCpuFloated] = useState(false);
  const [isControlFloated, setIsControlFloated] = useState(false);

  // ─── Renderers: Hardware Telemetry ───
  const renderHardwareTelemetry = (isFloated: boolean, onDock: () => void, dragHandleProps?: any) => (
    <div className={`${isFloated ? 'p-4' : ''}`}>
      <div 
        {...dragHandleProps}
        className={`flex items-center gap-2 mb-4 select-none ${isFloated ? 'cursor-grab active:cursor-grabbing bg-black/10 -mx-4 -mt-4 p-4 border-b border-white/5' : ''}`}
      >
        {isFloated ? (
          <GripVertical size={14} className="text-secondary-txt/45" />
        ) : (
          <Activity size={12} className="text-offline-core/60" />
        )}
        <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-offline-core/80 font-bold">
          Hardware_Telemetry
        </h3>
        {systemInfo && (
          <span className="ml-auto text-[10px] font-mono text-success-green/80 uppercase tracking-wider">
            Live
          </span>
        )}
        {isFloated ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onDock(); }}
            className="ml-2 text-secondary-txt/60 hover:text-error-red transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Dock Panel"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={() => setIsCpuFloated(true)}
            className="ml-2 text-secondary-txt/40 hover:text-offline-core transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Float Panel"
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      <div className="space-y-4 bg-black/20 border border-white/5 rounded-lg p-3">
        <TelemetryBar label="CPU" value={cpu} icon={<Cpu size={12} />} warning={cpu > 85} />
        <TelemetryBar label="RAM" value={ram} icon={<MemoryStick size={12} />} warning={ram > 90} />
        <TelemetryBar label="Disk" value={disk} icon={<HardDrive size={12} />} warning={disk > 90} />

        {/* Temperature readout */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs font-mono text-secondary-txt/70 uppercase tracking-wider">Core Temp</span>
          <span className={`text-sm font-mono font-bold ${temp > 75 ? 'text-error-red animate-pulse' : 'text-offline-core'}`}>
            {temp}°C
          </span>
        </div>
      </div>
    </div>
  );

  // ─── Renderers: Control Deck ───
  const renderControlDeck = (isFloated: boolean, onDock: () => void, dragHandleProps?: any) => (
    <div className={`${isFloated ? 'p-4' : ''}`}>
      <div 
        {...dragHandleProps}
        className={`flex items-center gap-2 mb-3 select-none ${isFloated ? 'cursor-grab active:cursor-grabbing bg-black/10 -mx-4 -mt-4 p-4 border-b border-white/5' : ''}`}
      >
        {isFloated ? (
          <GripVertical size={14} className="text-secondary-txt/45" />
        ) : (
          <Volume2 size={12} className="text-offline-core/60" />
        )}
        <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-offline-core/80 font-bold">
          Control_Deck
        </h3>
        {isFloated ? (
          <button 
            onClick={(e) => { e.stopPropagation(); onDock(); }}
            className="ml-auto text-secondary-txt/60 hover:text-error-red transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Dock Panel"
          >
            <X size={14} />
          </button>
        ) : (
          <button
            onClick={() => setIsControlFloated(true)}
            className="ml-auto text-secondary-txt/40 hover:text-offline-core transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
            title="Float Panel"
          >
            <ExternalLink size={12} />
          </button>
        )}
      </div>

      <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3">
        {/* Volume Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-mono text-secondary-txt/80 uppercase tracking-wider">
              {volume === 0 ? <VolumeX size={12} className="text-error-red" /> : <Volume2 size={12} className="text-offline-core" />}
              System Vol
            </span>
            <span className="text-xs font-mono font-bold text-offline-core">{volume}%</span>
          </div>
          <div className="relative group">
            <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-offline-core/40 to-offline-core rounded-full transition-all duration-100"
                style={{ width: `${volume}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-offline-core shadow-[0_0_10px_rgba(244,244,245,0.4)] pointer-events-none group-hover:scale-125 transition-transform"
              style={{ left: `calc(${volume}% - 6px)` }}
            />
          </div>
        </div>

        {/* Wifi & Bluetooth Toggles */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <HardwareToggle
            label="Wi-Fi"
            enabled={wifiEnabled}
            onToggle={() => setWifiEnabled(!wifiEnabled)}
            iconOn={<Wifi size={14} />}
            iconOff={<WifiOff size={14} />}
          />
          <HardwareToggle
            label="Bluetooth"
            enabled={btEnabled}
            onToggle={() => setBtEnabled(!btEnabled)}
            iconOn={<Bluetooth size={14} />}
            iconOff={<BluetoothOff size={14} />}
          />
        </div>
      </div>
    </div>
  );

  // ─── Renderers: Sidebar Placeholders ───
  const renderHardwarePlaceholder = () => (
    <div className="border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center min-h-[160px] bg-black/5 select-none">
      <Activity size={18} className="text-secondary-txt/20 mb-2" />
      <span className="text-[10px] font-mono text-secondary-txt/30 uppercase tracking-wider">
        Telemetry_Floated
      </span>
      <button 
        onClick={() => setIsCpuFloated(false)}
        className="mt-2 text-[9px] font-mono text-offline-core/60 hover:text-offline-core hover:underline cursor-pointer"
      >
        [Dock_Back]
      </button>
    </div>
  );

  const renderControlPlaceholder = () => (
    <div className="border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center min-h-[160px] bg-black/5 select-none">
      <Volume2 size={18} className="text-secondary-txt/20 mb-2" />
      <span className="text-[10px] font-mono text-secondary-txt/30 uppercase tracking-wider">
        Controls_Floated
      </span>
      <button 
        onClick={() => setIsControlFloated(false)}
        className="mt-2 text-[9px] font-mono text-offline-core/60 hover:text-offline-core hover:underline cursor-pointer"
      >
        [Dock_Back]
      </button>
    </div>
  );

  return (
    <>
      {/* Collapse/Expand Toggle Tab */}
      <button
        onClick={onToggle}
        className="absolute -left-8 top-1/2 -translate-y-1/2 z-30 w-7 h-16 bg-offline-surface-dark border border-offline-border/50 border-r-0 rounded-l-lg flex items-center justify-center text-secondary-txt hover:text-offline-core hover:bg-offline-surface transition-all duration-300 group"
        title={isOpen ? 'Collapse HUD' : 'Expand HUD'}
      >
        {isOpen ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
      </button>

      {/* Invisible Viewport Bounds Constraint for Dragging */}
      {(isCpuFloated || isControlFloated) && (
        <div ref={viewportRef} className="fixed inset-0 pointer-events-none z-30" />
      )}

      {/* ── Floating Panels Rendered outside Sidebar ── */}
      <AnimatePresence>
        {isCpuFloated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            drag
            dragListener={false}
            dragControls={cpuDragControls}
            dragConstraints={viewportRef}
            dragMomentum={false}
            dragElastic={0.05}
            className="fixed top-24 right-[20rem] z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto"
          >
            {renderHardwareTelemetry(true, () => setIsCpuFloated(false), {
              onPointerDown: (e: React.PointerEvent) => cpuDragControls.start(e)
            })}
          </motion.div>
        )}

        {isControlFloated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            drag
            dragListener={false}
            dragControls={controlDragControls}
            dragConstraints={viewportRef}
            dragMomentum={false}
            dragElastic={0.05}
            className="fixed bottom-24 right-[20rem] z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto"
          >
            {renderControlDeck(true, () => setIsControlFloated(false), {
              onPointerDown: (e: React.PointerEvent) => controlDragControls.start(e)
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Sidebar Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '18rem', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-full bg-offline-surface-dark border-l border-offline-border/60 overflow-hidden shrink-0 relative"
          >
            <div className="w-72 h-full overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
              
              {/* Telemetry Panel Items */}
              {isCpuFloated ? renderHardwarePlaceholder() : renderHardwareTelemetry(false, () => {})}
              
              {/* Controls Panel Items */}
              {isControlFloated ? renderControlPlaceholder() : renderControlDeck(false, () => {})}

              {/* ── Footer: Telemetry Mode State ── */}
              <div className="mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-success-green/60">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    systemInfo ? 'bg-success-green/60' : 'bg-secondary-txt/30 animate-pulse'
                  }`} />
                  Telemetry_Mode: {systemInfo ? 'Live' : 'Awaiting'}
                </div>
                <p className="text-[10px] font-mono text-secondary-txt/50 mt-1 leading-relaxed">
                  {systemInfo 
                    ? 'Streaming telemetry directly from Tauri backend.' 
                    : 'Waiting for backend telemetry stream...'}
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
