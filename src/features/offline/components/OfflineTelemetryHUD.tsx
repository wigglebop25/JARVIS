import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Cpu, MemoryStick, Wifi, WifiOff, Bluetooth, BluetoothOff,
  Volume2, VolumeX, ChevronRight, ChevronLeft,
  Activity, HardDrive, X, GripVertical, ExternalLink, Music,
  Play, Pause, Volume
} from 'lucide-react';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { useHardwareControl } from '@/hooks/useHardwareControl';
import { HardwareToggle } from '@/components/HardwareToggle';
import { useMediaSession } from './telemetry/hooks/useMediaSession';
import { PanelPlaceholder } from './telemetry/shared/PanelPlaceholder';
import { AudioVisualizer } from './telemetry/shared/AudioVisualizer';

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

interface OfflineTelemetryHUDProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const OfflineTelemetryHUD = ({ isOpen, onToggle }: OfflineTelemetryHUDProps) => {
  const { systemInfo } = useSystemInfo();
  const viewportRef = useRef<HTMLDivElement>(null);

  const {
    isPlaying, trackTitle, trackArtist, trackProgress, trackDuration,
    coverArt, isMediaSupported, hasActiveMedia, togglePlayPause,
  } = useMediaSession();

  const cpu = systemInfo ? Math.round(systemInfo.cpu_usage) : 0;
  const ram = systemInfo ? Math.round(systemInfo.ram_usage) : 0;
  const disk = systemInfo ? Math.round(systemInfo.disk_usage) : 0;
  const temp = systemInfo?.cpu_temperature ? Math.round(systemInfo.cpu_temperature) : 0;

  const { hardwareState, isLoading, isSupported, error, clearError, setInteracting, setVolume, setWifi, setBluetooth } = useHardwareControl();

  const isDraggingRef = useRef(false);
  const [sliderVolume, setSliderVolume] = useState(hardwareState.volume.level);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setSliderVolume(hardwareState.volume.level);
    }
  }, [hardwareState.volume.level]);

  useEffect(() => {
    if (error && isDraggingRef.current) {
      setSliderVolume(hardwareState.volume.level);
    }
  }, [error, hardwareState.volume.level]);

  const [isCpuFloated, setIsCpuFloated] = useState(false);
  const [isControlFloated, setIsControlFloated] = useState(false);
  const [isSpotifyFloated, setIsSpotifyFloated] = useState(false);
  const [panelOrder, setPanelOrder] = useState<string[]>(['cpu', 'control', 'spotify']);

  const cpuDragControls = useDragControls();
  const spotifyDragControls = useDragControls();
  const controlDragControls = useDragControls();
  const [cpuPos, setCpuPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 608 : 800, y: 96 });
  const [spotifyPos, setSpotifyPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 608 : 800, y: 352 });
  const [controlPos, setControlPos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth - 608 : 800, y: typeof window !== 'undefined' ? window.innerHeight - 384 : 500 });

  const cpuDragStartPos = useRef({ x: 0, y: 0 });
  const spotifyDragStartPos = useRef({ x: 0, y: 0 });
  const controlDragStartPos = useRef({ x: 0, y: 0 });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = trackDuration > 0 ? (trackProgress / trackDuration) * 100 : 0;

  const renderPanelHeader = (title: string, icon: React.ReactNode, isFloated: boolean, onFloat: () => void, onDock: () => void, dragControls?: ReturnType<typeof useDragControls>) => (
    <div
      className={`flex items-center gap-2 mb-3 select-none ${isFloated ? 'cursor-grab active:cursor-grabbing bg-black/10 -mx-4 -mt-4 p-4 border-b border-white/5' : ''}`}
      onPointerDown={isFloated && dragControls ? (e) => { e.preventDefault(); dragControls.start(e); } : undefined}
    >
      {isFloated ? (
        <GripVertical size={14} className="text-secondary-txt/45" />
      ) : (
        <>
          <div className="cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1 -ml-1 flex items-center justify-center">
            <GripVertical size={12} />
          </div>
          {icon}
        </>
      )}
      <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-offline-core/80 font-bold">{title}</h3>
      {isFloated ? (
        <button onClick={(e) => { e.stopPropagation(); onDock(); }} className="ml-auto text-secondary-txt/60 hover:text-error-red transition-colors p-1 rounded hover:bg-white/5 cursor-pointer" title="Dock Panel">
          <X size={14} />
        </button>
      ) : (
        <button onClick={onFloat} className="ml-auto text-secondary-txt/40 hover:text-offline-core transition-colors p-1 rounded hover:bg-white/5 cursor-pointer" title="Float Panel">
          <ExternalLink size={12} />
        </button>
      )}
    </div>
  );

  const volumeSliderDisabled = !hardwareState.volume.available || isLoading;

  const volumeSliderContent = (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-mono text-secondary-txt/80 uppercase tracking-wider">
            {sliderVolume === 0 ? <VolumeX size={12} className="text-error-red" /> : <Volume2 size={12} className="text-offline-core" />}
            System Vol
          </span>
          <span className="text-xs font-mono font-bold text-offline-core">{sliderVolume}%</span>
        </div>
        <div className="relative group">
          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-offline-core/40 to-offline-core rounded-full" style={{ width: `${sliderVolume}%` }} />
          </div>
          <input
            type="range" min={0} max={100} step={1} value={sliderVolume}
            onChange={(e) => setSliderVolume(parseInt(e.target.value))}
            onPointerDown={() => { isDraggingRef.current = true; setInteracting(true); }}
            onPointerUp={() => { isDraggingRef.current = false; setVolume(sliderVolume); setInteracting(false); clearError(); }}
            onPointerLeave={() => { if (isDraggingRef.current) { isDraggingRef.current = false; setVolume(sliderVolume); setInteracting(false); clearError(); } }}
            disabled={volumeSliderDisabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-offline-core shadow-[0_0_10px_rgba(244,244,245,0.4)] pointer-events-none group-hover:scale-125 transition-transform" style={{ left: `calc(${sliderVolume}% - 6px)` }} />
        </div>
      </div>
      <div className="space-y-2 pt-2 border-t border-white/5">
        <HardwareToggle label="Wi-Fi" enabled={hardwareState.wifi.enabled} onToggle={() => setWifi(!hardwareState.wifi.enabled)} iconOn={<Wifi size={14} />} iconOff={<WifiOff size={14} />} disabled={!hardwareState.wifi.available || isLoading} />
        <HardwareToggle label="Bluetooth" enabled={hardwareState.bluetooth.enabled} onToggle={() => setBluetooth(!hardwareState.bluetooth.enabled)} iconOn={<Bluetooth size={14} />} iconOff={<BluetoothOff size={14} />} disabled={!hardwareState.bluetooth.available || isLoading} />
      </div>
    </>
  );

  const notSupportedFootnote = !isSupported && (
    <p className="text-[10px] font-mono text-secondary-txt/55 pt-2">Hardware controls unavailable: Tauri backend not reachable.</p>
  );

  const errorDisplay = error && (
    <p className="text-[10px] font-mono text-error-red pt-2">{error}</p>
  );

  return (
    <>
      <button
        onClick={onToggle}
        className="absolute -left-8 top-1/2 -translate-y-1/2 z-30 w-7 h-16 bg-offline-surface-dark border border-offline-border/50 border-r-0 rounded-l-lg flex items-center justify-center text-secondary-txt hover:text-offline-core hover:bg-offline-surface transition-all duration-300 group"
        title={isOpen ? 'Collapse HUD' : 'Expand HUD'}
      >
        {isOpen ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
      </button>

      <div ref={viewportRef} className="fixed inset-0 pointer-events-none z-30" />

      <AnimatePresence>
        {isCpuFloated && (
          <motion.div
            key="cpu-float"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto flex flex-col"
            style={{ left: cpuPos.x, top: cpuPos.y, resize: 'both', minWidth: '260px', minHeight: '200px', maxWidth: '480px', maxHeight: '500px' }}
            drag
            dragListener={false}
            dragControls={cpuDragControls}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => { cpuDragStartPos.current = cpuPos; }}
            onDrag={(_, info) => {
              const x = Math.max(0, Math.min(window.innerWidth - 288, cpuDragStartPos.current.x + info.offset.x));
              const y = Math.max(0, Math.min(window.innerHeight - 100, cpuDragStartPos.current.y + info.offset.y));
              setCpuPos({ x, y });
            }}
          >
            <div className="p-4 h-full flex flex-col overflow-hidden">
              {renderPanelHeader('Hardware_Telemetry', <Activity size={12} className="text-offline-core/60" />, true, () => {}, () => setIsCpuFloated(false), cpuDragControls)}
              <div className="space-y-4 bg-black/20 border border-white/5 rounded-lg p-3 flex-1 overflow-y-auto custom-scrollbar">
                <TelemetryBar label="CPU" value={cpu} icon={<Cpu size={12} />} warning={cpu > 85} />
                <TelemetryBar label="RAM" value={ram} icon={<MemoryStick size={12} />} warning={ram > 90} />
                <TelemetryBar label="Disk" value={disk} icon={<HardDrive size={12} />} warning={disk > 90} />
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-mono text-secondary-txt/70 uppercase tracking-wider">Core Temp</span>
                  <span className={`text-sm font-mono font-bold ${temp > 75 ? 'text-error-red animate-pulse' : 'text-offline-core'}`}>{temp}°C</span>
                </div>
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-offline-core/25 pointer-events-none rounded-br-sm" />
          </motion.div>
        )}

        {isSpotifyFloated && (
          <motion.div
            key="spotify-float"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto flex flex-col"
            style={{ left: spotifyPos.x, top: spotifyPos.y, resize: 'both', minWidth: '260px', minHeight: '160px', maxWidth: '480px', maxHeight: '500px' }}
            drag
            dragListener={false}
            dragControls={spotifyDragControls}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => { spotifyDragStartPos.current = spotifyPos; }}
            onDrag={(_, info) => {
              const x = Math.max(0, Math.min(window.innerWidth - 288, spotifyDragStartPos.current.x + info.offset.x));
              const y = Math.max(0, Math.min(window.innerHeight - 100, spotifyDragStartPos.current.y + info.offset.y));
              setSpotifyPos({ x, y });
            }}
          >
            <div className="p-4 h-full flex flex-col overflow-hidden">
              {renderPanelHeader('Media_Monitor', <Music size={12} className="text-offline-core/60" />, true, () => {}, () => setIsSpotifyFloated(false), spotifyDragControls)}
              <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3 flex-1">
                <MediaContent
                  isMediaSupported={isMediaSupported} hasActiveMedia={hasActiveMedia}
                  isPlaying={isPlaying} coverArt={coverArt}
                  trackTitle={trackTitle} trackArtist={trackArtist}
                  trackProgress={trackProgress} trackDuration={trackDuration}
                  progressPercent={progressPercent}
                  togglePlayPause={togglePlayPause}
                  formatTime={formatTime} formatDuration={formatDuration}
                />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-offline-core/25 pointer-events-none rounded-br-sm" />
          </motion.div>
        )}

        {isControlFloated && (
          <motion.div
            key="control-float"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto flex flex-col"
            style={{ left: controlPos.x, top: controlPos.y, resize: 'both', minWidth: '260px', minHeight: '220px', maxWidth: '480px', maxHeight: '500px' }}
            drag
            dragListener={false}
            dragControls={controlDragControls}
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0}
            dragMomentum={false}
            onDragStart={() => { controlDragStartPos.current = controlPos; }}
            onDrag={(_, info) => {
              const x = Math.max(0, Math.min(window.innerWidth - 288, controlDragStartPos.current.x + info.offset.x));
              const y = Math.max(0, Math.min(window.innerHeight - 100, controlDragStartPos.current.y + info.offset.y));
              setControlPos({ x, y });
            }}
          >
            <div className="p-4 h-full flex flex-col overflow-hidden">
              {renderPanelHeader('Control_Deck', <Volume2 size={12} className="text-offline-core/60" />, true, () => {}, () => setIsControlFloated(false), controlDragControls)}
              <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {volumeSliderContent}
                {notSupportedFootnote}
                {errorDisplay}
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-offline-core/25 pointer-events-none rounded-br-sm" />
          </motion.div>
        )}
      </AnimatePresence>

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
              <Reorder.Group axis="y" values={panelOrder} onReorder={setPanelOrder} className="flex flex-col gap-5">
                {panelOrder.map((panelId) => {
                  if (panelId === 'cpu') {
                    return (
                      <Reorder.Item key="cpu" value="cpu" className="outline-none">
                        {isCpuFloated ? (
                          <PanelPlaceholder icon={<Activity size={18} />} title="Telemetry_Floated" description="Panel is in floating mode" buttonText="[Dock_Back]" onAction={() => setIsCpuFloated(false)} />
                        ) : (
                          <div>
                            {renderPanelHeader('Hardware_Telemetry', <Activity size={12} className="text-offline-core/60" />, false, () => setIsCpuFloated(true), () => {})}
                            <div className="space-y-4 bg-black/20 border border-white/5 rounded-lg p-3">
                              <TelemetryBar label="CPU" value={cpu} icon={<Cpu size={12} />} warning={cpu > 85} />
                              <TelemetryBar label="RAM" value={ram} icon={<MemoryStick size={12} />} warning={ram > 90} />
                              <TelemetryBar label="Disk" value={disk} icon={<HardDrive size={12} />} warning={disk > 90} />
                              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-xs font-mono text-secondary-txt/70 uppercase tracking-wider">Core Temp</span>
                                <span className={`text-sm font-mono font-bold ${temp > 75 ? 'text-error-red animate-pulse' : 'text-offline-core'}`}>{temp}°C</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Reorder.Item>
                    );
                  }
                  if (panelId === 'control') {
                    return (
                      <Reorder.Item key="control" value="control" className="outline-none">
                        {isControlFloated ? (
                          <PanelPlaceholder icon={<Volume size={18} />} title="Controls_Floated" description="Panel is in floating mode" buttonText="[Dock_Back]" onAction={() => setIsControlFloated(false)} />
                        ) : (
                          <div>
                            {renderPanelHeader('Control_Deck', <Volume2 size={12} className="text-offline-core/60" />, false, () => setIsControlFloated(true), () => {})}
                            <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3">
                              {volumeSliderContent}
                              {notSupportedFootnote}
                              {errorDisplay}
                            </div>
                          </div>
                        )}
                      </Reorder.Item>
                    );
                  }
                  if (panelId === 'spotify') {
                    return (
                      <Reorder.Item key="spotify" value="spotify" className="outline-none">
                        {isSpotifyFloated ? (
                          <PanelPlaceholder icon={<Music size={18} />} title="Media_Floated" description="Panel is in floating mode" buttonText="[Dock_Back]" onAction={() => setIsSpotifyFloated(false)} />
                        ) : (
                          <div>
                            {renderPanelHeader('Media_Monitor', <Music size={12} className="text-offline-core/60" />, false, () => setIsSpotifyFloated(true), () => {})}
                            <div className="bg-black/20 border border-white/5 rounded-lg p-3 space-y-3">
                              <MediaContent
                                isMediaSupported={isMediaSupported} hasActiveMedia={hasActiveMedia}
                                isPlaying={isPlaying} coverArt={coverArt}
                                trackTitle={trackTitle} trackArtist={trackArtist}
                                trackProgress={trackProgress} trackDuration={trackDuration}
                                progressPercent={progressPercent}
                                togglePlayPause={togglePlayPause}
                                formatTime={formatTime} formatDuration={formatDuration}
                              />
                            </div>
                          </div>
                        )}
                      </Reorder.Item>
                    );
                  }
                  return null;
                })}
              </Reorder.Group>

              <div className="mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-success-green/60">
                  <div className={`w-1.5 h-1.5 rounded-full ${systemInfo ? 'bg-success-green/60' : 'bg-secondary-txt/30 animate-pulse'}`} />
                  Telemetry_Mode: {systemInfo ? 'Live' : 'Awaiting'}
                </div>
                <p className="text-[10px] font-mono text-secondary-txt/50 mt-1 leading-relaxed">
                  {systemInfo ? 'Streaming telemetry directly from Tauri backend.' : 'Waiting for backend telemetry stream...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface MediaContentProps {
  isMediaSupported: boolean;
  hasActiveMedia: boolean;
  isPlaying: boolean;
  coverArt: string | null;
  trackTitle: string;
  trackArtist: string;
  trackProgress: number;
  trackDuration: number;
  progressPercent: number;
  togglePlayPause: () => void;
  formatTime: (secs: number) => string;
  formatDuration: (secs: number) => string;
}

const MediaContent = ({
  isMediaSupported, hasActiveMedia, isPlaying, coverArt,
  trackTitle, trackArtist, trackProgress, trackDuration, progressPercent,
  togglePlayPause, formatTime, formatDuration
}: MediaContentProps) => (
  <>
    <div className="flex gap-3 items-center">
      <button
        onClick={togglePlayPause}
        disabled={isMediaSupported && !hasActiveMedia}
        className={`w-16 h-16 rounded bg-gradient-to-br from-offline-core/20 to-offline-core/5 border border-offline-core/25 flex items-center justify-center relative overflow-hidden shrink-0 shadow-lg group/cover transition-all duration-300 outline-none focus:border-offline-core/50 ${
          isMediaSupported && !hasActiveMedia ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-offline-core/50 hover:shadow-[0_0_12px_rgba(244,244,245,0.15)]'
        }`}
        title={isMediaSupported && !hasActiveMedia ? undefined : (isPlaying ? 'Pause' : 'Play')}
      >
        {coverArt ? (
          <img src={coverArt} alt="Album Art" className="w-full h-full object-cover relative z-20 transition-transform duration-500 group-hover/cover:scale-105" />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)] z-10" />
            <motion.div
              animate={isPlaying && hasActiveMedia ? { rotate: 360 } : {}}
              transition={isPlaying && hasActiveMedia ? { duration: 15, repeat: Infinity, ease: 'linear' } : {}}
              className="w-10 h-10 rounded-full border border-dashed border-offline-core/30 flex items-center justify-center opacity-65"
            >
              <div className="w-4 h-4 rounded-full border border-offline-core/20 bg-black/60" />
            </motion.div>
            <div className="absolute inset-0 bg-offline-core/5 opacity-50 animate-pulse" />
          </div>
        )}
        {(!isMediaSupported || hasActiveMedia) && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center z-30 transition-opacity duration-300">
            {isPlaying ? <Pause size={20} className="text-white drop-shadow-[0_0_8px_rgba(244,244,245,0.6)]" /> : <Play size={20} className="text-white ml-0.5 drop-shadow-[0_0_8px_rgba(244,244,245,0.6)]" />}
          </div>
        )}
      </button>
      <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
        <h4 className="text-xs font-mono font-bold text-primary-txt truncate uppercase tracking-wide leading-tight">
          {isMediaSupported && !hasActiveMedia ? 'Awaiting Media' : trackTitle}
        </h4>
        <p className="text-[9px] font-mono text-secondary-txt/60 truncate uppercase tracking-widest mt-1">
          {isMediaSupported && !hasActiveMedia ? 'System Idle' : trackArtist}
        </p>
      </div>
      <div className="h-16 flex items-center shrink-0">
        <AudioVisualizer barCount={6} />
      </div>
    </div>
    <div className="space-y-1.5 pt-1">
      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
        <div className="h-full bg-gradient-to-r from-offline-core/60 to-offline-core rounded-full shadow-[0_0_8px_rgba(244,244,245,0.3)]" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="flex items-center justify-between text-[8px] font-mono text-secondary-txt/70 font-bold tracking-wider">
        <span>{formatTime(trackProgress)}</span>
        <span>{formatDuration(trackDuration)}</span>
      </div>
    </div>
  </>
);
