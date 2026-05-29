import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls, Reorder } from 'framer-motion';
import {
  Cpu, MemoryStick, Wifi, WifiOff, Bluetooth, BluetoothOff,
  Volume2, VolumeX, ChevronRight, ChevronLeft,
  Activity, HardDrive, X, GripVertical, ExternalLink, Music,
  Play, Pause
} from 'lucide-react';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { mediaControls, PlaybackStatus, getMetadata, getPlaybackInfo, isEnabled, getPlaybackStatus, getPosition } from 'tauri-plugin-media-api';

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
  const spotifyDragControls = useDragControls();

  // Sidebar Reordering controls
  const sidebarCpuDragControls = useDragControls();
  const sidebarControlDragControls = useDragControls();
  const sidebarSpotifyDragControls = useDragControls();

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
  const [isSpotifyFloated, setIsSpotifyFloated] = useState(false);

  // Sidebar Layout ordering
  const [panelOrder, setPanelOrder] = useState<string[]>(['cpu', 'control', 'spotify']);

  // ─── Real Media Session Support ──────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackTitle, setTrackTitle] = useState('Station Calibration');
  const [trackArtist, setTrackArtist] = useState('Neural Network');
  const [trackProgress, setTrackProgress] = useState(105); // seconds (1:45)
  const [trackDuration, setTrackDuration] = useState(200); // seconds (3:20)
  const [mediaSource, setMediaSource] = useState('Spotify');
  const [isMediaSupported, setIsMediaSupported] = useState(false);
  const [hasActiveMedia, setHasActiveMedia] = useState(false);
  const [coverArt, setCoverArt] = useState<string | null>(null);

  // Initialize and check media session support
  useEffect(() => {
    let active = true;
    const initAndCheckSupport = async () => {
      try {
        // Initialize our media session first to enable the controls
        await mediaControls.initialize('jarvis', 'JARVIS Media');
        // Verify support
        const supported = await isEnabled();
        if (active) {
          setIsMediaSupported(supported);
        }
      } catch (err: any) {
        console.warn('Media controls not supported or outside Tauri environment:', err);
        if (active) {
          setIsMediaSupported(false);
        }
      }
    };
    initAndCheckSupport();
    return () => { active = false; };
  }, []);

  // Polling loop for active system media controls status
  useEffect(() => {
    let active = true;

    if (isMediaSupported) {
      const interval = setInterval(async () => {
        try {
          let metadata: any = null;
          try {
            metadata = await getMetadata();
          } catch (e: any) {
            console.warn('getMetadata failed:', e);
          }

          let info: any = null;
          try {
            info = await getPlaybackInfo();
          } catch (e: any) {
            const errMsg = String(e);
            if (!errMsg.includes('0x00000000') && !errMsg.includes('completed successfully')) {
              console.warn('getPlaybackInfo failed:', e);
            }
          }

          if (!active) return;

          // If getPlaybackInfo failed (very common on Spotify due to unsupported PlaybackRate returning E_POINTER),
          // fallback to getPlaybackStatus() and getPosition() which are safe.
          let statusVal = PlaybackStatus.Stopped;
          let posVal = 0;

          if (info) {
            statusVal = info.status;
            posVal = info.position || 0;
          } else {
            try {
              statusVal = await getPlaybackStatus();
              posVal = await getPosition();
            } catch (fallbackErr: any) {
              console.warn('Playback status/position fallback failed:', fallbackErr);
            }
          }



          if (metadata && (metadata.title || metadata.artist)) {
            setHasActiveMedia(true);
            setTrackTitle(metadata.title || 'Unknown Title');
            setTrackArtist(metadata.artist || 'Unknown Artist');
            setTrackProgress(posVal);

            if (metadata.duration && metadata.duration > 0) {
              setTrackDuration(metadata.duration);
            } else {
              setTrackDuration(0); // Display as --:-- if unavailable
            }

            setIsPlaying(statusVal === PlaybackStatus.Playing);

            // Handle Album Cover Image Data
            if (metadata.artworkData) {
              const src = metadata.artworkData.startsWith('data:')
                ? metadata.artworkData
                : `data:image/png;base64,${metadata.artworkData}`;
              setCoverArt(src);
            } else if (metadata.artworkUrl) {
              setCoverArt(metadata.artworkUrl);
            } else {
              setCoverArt(null);
            }

            if (metadata.albumArtist) {
              setMediaSource(metadata.albumArtist);
            } else if (metadata.album) {
              setMediaSource(metadata.album);
            } else {
              setMediaSource('System Player');
            }
          } else {
            // No active media metadata
            setHasActiveMedia(false);
            setIsPlaying(false);
          }
        } catch (err: any) {
          console.warn('Failed to get active system media details:', err);
        }
      }, 1000);

      return () => {
        active = false;
        clearInterval(interval);
      };
    } else {
      // Fallback: Mock timer loop for development/testing
      setHasActiveMedia(true);
      const interval = setInterval(() => {
        if (isPlaying) {
          setTrackProgress(prev => (prev >= trackDuration ? 0 : prev + 1));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isMediaSupported, isPlaying, trackDuration]);

  const handleTogglePlayPause = async () => {
    if (!isMediaSupported) {
      setIsPlaying(!isPlaying);
      return;
    }
    try {
      await mediaControls.togglePlayPause();
      
      // Query the updated state using library functions, suppressing false-positive success errors
      let newPlaying = !isPlaying;
      try {
        const info = await getPlaybackInfo();
        if (info) {
          newPlaying = info.status === PlaybackStatus.Playing;
        } else {
          const status = await getPlaybackStatus();
          newPlaying = status === PlaybackStatus.Playing;
        }
      } catch (e) {
        // Fallback to getPlaybackStatus if getPlaybackInfo throws
        try {
          const status = await getPlaybackStatus();
          newPlaying = status === PlaybackStatus.Playing;
        } catch (statusErr) {
          newPlaying = !isPlaying;
        }
      }
      setIsPlaying(newPlaying);
    } catch (err) {
      const errMsg = String(err);
      if (!errMsg.includes('0x00000000') && !errMsg.includes('completed successfully')) {
        console.warn('Failed to toggle play/pause:', err);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (secs: number) => {
    if (secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatDuration = (secs: number) => {
    if (secs <= 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = trackDuration > 0 ? (trackProgress / trackDuration) * 100 : 0;

  // ─── Renderers: Hardware Telemetry ───
  const renderHardwareTelemetry = (isFloated: boolean, onDock: () => void, dragHandleProps?: any, sidebarDragHandleProps?: any) => (
    <div className={`${isFloated ? 'p-4 h-full flex flex-col overflow-hidden' : ''}`}>
      <div
        {...dragHandleProps}
        className={`flex items-center gap-2 mb-4 select-none ${isFloated ? 'cursor-grab active:cursor-grabbing bg-black/10 -mx-4 -mt-4 p-4 border-b border-white/5' : ''}`}
      >
        {isFloated ? (
          <GripVertical size={14} className="text-secondary-txt/45" />
        ) : (
          <>
            <div {...sidebarDragHandleProps} className="cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1 -ml-1 flex items-center justify-center">
              <GripVertical size={12} />
            </div>
            <Activity size={12} className="text-offline-core/60" />
          </>
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

      <div className={`space-y-4 bg-black/20 border border-white/5 rounded-lg p-3 ${isFloated ? 'flex-1 overflow-y-auto custom-scrollbar' : ''}`}>
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
  const renderControlDeck = (isFloated: boolean, onDock: () => void, dragHandleProps?: any, sidebarDragHandleProps?: any) => (
    <div className={`${isFloated ? 'p-4 h-full flex flex-col overflow-hidden' : ''}`}>
      <div
        {...dragHandleProps}
        className={`flex items-center gap-2 mb-3 select-none ${isFloated ? 'cursor-grab active:cursor-grabbing bg-black/10 -mx-4 -mt-4 p-4 border-b border-white/5' : ''}`}
      >
        {isFloated ? (
          <GripVertical size={14} className="text-secondary-txt/45" />
        ) : (
          <>
            <div {...sidebarDragHandleProps} className="cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1 -ml-1 flex items-center justify-center">
              <GripVertical size={12} />
            </div>
            <Volume2 size={12} className="text-offline-core/60" />
          </>
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

      <div className={`bg-black/20 border border-white/5 rounded-lg p-3 space-y-3 ${isFloated ? 'flex-1 overflow-y-auto custom-scrollbar' : ''}`}>
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

  // ─── Renderers: Spotify Deck ───
  const renderSpotifyDeck = (isFloated: boolean, onDock: () => void, dragHandleProps?: any, sidebarDragHandleProps?: any) => {
    // Inner Audio Visualizer component
    const AudioVisualizer = ({ isPlaying }: { isPlaying: boolean }) => (
      <div className="flex items-end gap-[2px] h-3.5 shrink-0 px-1">
        {Array.from({ length: 6 }).map((_, i) => {
          const duration = 0.55 + (i % 3) * 0.15;
          const delay = (i % 2) * 0.08;
          return (
            <motion.div
              key={i}
              animate={
                isPlaying
                  ? {
                    height: ["15%", "100%", "15%"],
                  }
                  : {
                    height: "15%",
                  }
              }
              transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut",
              }}
              className="w-[2px] bg-offline-core/80 rounded-full"
            />
          );
        })}
      </div>
    );

    return (
      <div className={`${isFloated ? 'p-4 h-full flex flex-col overflow-hidden' : ''}`}>
        <div
          {...dragHandleProps}
          className={`flex items-center gap-2 mb-3 select-none ${isFloated ? 'cursor-grab active:cursor-grabbing bg-black/10 -mx-4 -mt-4 p-4 border-b border-white/5' : ''}`}
        >
          {isFloated ? (
            <GripVertical size={14} className="text-secondary-txt/45" />
          ) : (
            <>
              <div {...sidebarDragHandleProps} className="cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1 -ml-1 flex items-center justify-center">
                <GripVertical size={12} />
              </div>
              <Music size={12} className="text-offline-core/60" />
            </>
          )}
          <h3 className="text-xs font-mono uppercase tracking-[0.15em] text-offline-core/80 font-bold">
            Media_Monitor
          </h3>
          <span className="ml-auto text-[8px] font-mono text-offline-core/50 uppercase tracking-widest bg-offline-core/5 border border-offline-core/10 px-1.5 py-0.5 rounded">
            {isMediaSupported && !hasActiveMedia ? 'Inactive' : mediaSource}
          </span>
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
              onClick={() => setIsSpotifyFloated(true)}
              className="ml-2 text-secondary-txt/40 hover:text-offline-core transition-colors p-1 rounded hover:bg-white/5 cursor-pointer"
              title="Float Panel"
            >
              <ExternalLink size={12} />
            </button>
          )}
        </div>

        <div className={`bg-black/20 border border-white/5 rounded-lg p-3 space-y-3 ${isFloated ? 'flex-1 overflow-y-auto custom-scrollbar' : ''}`}>
          <div className="flex gap-3 items-center">
            {/* Album Cover / CD Cover */}
            <button
              onClick={handleTogglePlayPause}
              disabled={isMediaSupported && !hasActiveMedia}
              className={`w-16 h-16 rounded bg-gradient-to-br from-offline-core/20 to-offline-core/5 border border-offline-core/25 flex items-center justify-center relative overflow-hidden shrink-0 shadow-lg group/cover transition-all duration-300 outline-none focus:border-offline-core/50 ${
                isMediaSupported && !hasActiveMedia
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:border-offline-core/50 hover:shadow-[0_0_12px_rgba(244,244,245,0.15)]'
              }`}
              title={isMediaSupported && !hasActiveMedia ? undefined : (isPlaying ? "Pause" : "Play")}
            >
              {coverArt ? (
                <img
                  src={coverArt}
                  alt="Album Art"
                  className="w-full h-full object-cover relative z-20 transition-transform duration-500 group-hover/cover:scale-105"
                />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.8)_100%)] z-10" />
                  <motion.div
                    animate={isPlaying && hasActiveMedia ? { rotate: 360 } : {}}
                    transition={isPlaying && hasActiveMedia ? { duration: 15, repeat: Infinity, ease: "linear" } : {}}
                    className="w-10 h-10 rounded-full border border-dashed border-offline-core/30 flex items-center justify-center opacity-65"
                  >
                    <div className="w-4 h-4 rounded-full border border-offline-core/20 bg-black/60" />
                  </motion.div>
                  <div className="absolute inset-0 bg-offline-core/5 opacity-50 animate-pulse" />
                </div>
              )}
              {/* Play/Pause Hover Overlay */}
              {(!isMediaSupported || hasActiveMedia) && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 flex items-center justify-center z-30 transition-opacity duration-300">
                  {isPlaying ? (
                    <Pause size={20} className="text-white drop-shadow-[0_0_8px_rgba(244,244,245,0.6)]" />
                  ) : (
                    <Play size={20} className="text-white ml-0.5 drop-shadow-[0_0_8px_rgba(244,244,245,0.6)]" />
                  )}
                </div>
              )}
            </button>

            {/* Track details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
              <h4 className="text-xs font-mono font-bold text-primary-txt truncate uppercase tracking-wide leading-tight">
                {isMediaSupported && !hasActiveMedia ? 'Awaiting Media' : trackTitle}
              </h4>
              <p className="text-[9px] font-mono text-secondary-txt/60 truncate uppercase tracking-widest mt-1">
                {isMediaSupported && !hasActiveMedia ? 'System Idle' : trackArtist}
              </p>
            </div>

            {/* Live Audio Visualizer */}
            <div className="h-16 flex items-center shrink-0">
              <AudioVisualizer isPlaying={isPlaying && hasActiveMedia} />
            </div>
          </div>

          {/* Progress Slider (Row 2) */}
          <div className="space-y-1.5 pt-1">
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10 relative">
              <div
                className="h-full bg-gradient-to-r from-offline-core/60 to-offline-core rounded-full shadow-[0_0_8px_rgba(244,244,245,0.3)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[8px] font-mono text-secondary-txt/70 font-bold tracking-wider">
              <span>{formatTime(trackProgress)}</span>
              <span>{formatDuration(trackDuration)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Renderers: Sidebar Placeholders ───
  const renderHardwarePlaceholder = (sidebarDragHandleProps?: any) => (
    <div className="border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center min-h-[160px] bg-black/5 select-none relative">
      <div {...sidebarDragHandleProps} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1">
        <GripVertical size={12} />
      </div>
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

  const renderControlPlaceholder = (sidebarDragHandleProps?: any) => (
    <div className="border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center min-h-[160px] bg-black/5 select-none relative">
      <div {...sidebarDragHandleProps} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1">
        <GripVertical size={12} />
      </div>
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

  const renderSpotifyPlaceholder = (sidebarDragHandleProps?: any) => (
    <div className="border border-dashed border-white/10 rounded-lg p-4 flex flex-col items-center justify-center min-h-[120px] bg-black/5 select-none relative">
      <div {...sidebarDragHandleProps} className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-secondary-txt/30 hover:text-offline-core transition-colors p-1">
        <GripVertical size={12} />
      </div>
      <Music size={18} className="text-secondary-txt/20 mb-2" />
      <span className="text-[10px] font-mono text-secondary-txt/30 uppercase tracking-wider">
        Media_Floated
      </span>
      <button
        onClick={() => setIsSpotifyFloated(false)}
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
      <div ref={viewportRef} className="fixed inset-0 pointer-events-none z-30" />

      {/* ── Floating Panels Rendered outside Sidebar ── */}
      <AnimatePresence>
        {isCpuFloated && (
          <motion.div
            key="cpu-float"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            drag
            dragListener={false}
            dragControls={cpuDragControls}
            dragConstraints={viewportRef}
            dragMomentum={false}
            dragElastic={0.05}
            className="fixed top-24 right-[20rem] z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto flex flex-col"
            style={{
              resize: 'both',
              minWidth: '260px',
              minHeight: '200px',
              maxWidth: '480px',
              maxHeight: '500px'
            }}
          >
            {renderHardwareTelemetry(true, () => setIsCpuFloated(false), {
              onPointerDown: (e: React.PointerEvent) => cpuDragControls.start(e)
            })}
            {/* Custom visual indicator for resize in bottom-right corner */}
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-offline-core/25 pointer-events-none rounded-br-sm" />
          </motion.div>
        )}

        {isSpotifyFloated && (
          <motion.div
            key="spotify-float"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            drag
            dragListener={false}
            dragControls={spotifyDragControls}
            dragConstraints={viewportRef}
            dragMomentum={false}
            dragElastic={0.05}
            className="fixed top-[22rem] right-[20rem] z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto flex flex-col"
            style={{
              resize: 'both',
              minWidth: '260px',
              minHeight: '160px',
              maxWidth: '480px',
              maxHeight: '500px'
            }}
          >
            {renderSpotifyDeck(true, () => setIsSpotifyFloated(false), {
              onPointerDown: (e: React.PointerEvent) => spotifyDragControls.start(e)
            })}
            {/* Custom visual indicator for resize in bottom-right corner */}
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-offline-core/25 pointer-events-none rounded-br-sm" />
          </motion.div>
        )}

        {isControlFloated && (
          <motion.div
            key="control-float"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            drag
            dragListener={false}
            dragControls={controlDragControls}
            dragConstraints={viewportRef}
            dragMomentum={false}
            dragElastic={0.05}
            className="fixed bottom-24 right-[20rem] z-40 w-72 bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md overflow-hidden pointer-events-auto flex flex-col"
            style={{
              resize: 'both',
              minWidth: '260px',
              minHeight: '220px',
              maxWidth: '480px',
              maxHeight: '500px'
            }}
          >
            {renderControlDeck(true, () => setIsControlFloated(false), {
              onPointerDown: (e: React.PointerEvent) => controlDragControls.start(e)
            })}
            {/* Custom visual indicator for resize in bottom-right corner */}
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r-2 border-b-2 border-offline-core/25 pointer-events-none rounded-br-sm" />
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
              <Reorder.Group
                axis="y"
                values={panelOrder}
                onReorder={setPanelOrder}
                className="flex flex-col gap-5"
              >
                {panelOrder.map((panelId) => {
                  if (panelId === 'cpu') {
                    return (
                      <Reorder.Item
                        key="cpu"
                        value="cpu"
                        dragListener={false}
                        dragControls={sidebarCpuDragControls}
                        className="outline-none"
                      >
                        {isCpuFloated
                          ? renderHardwarePlaceholder({
                            onPointerDown: (e: React.PointerEvent) => sidebarCpuDragControls.start(e)
                          })
                          : renderHardwareTelemetry(
                            false,
                            () => { },
                            undefined,
                            {
                              onPointerDown: (e: React.PointerEvent) => sidebarCpuDragControls.start(e)
                            }
                          )}
                      </Reorder.Item>
                    );
                  }
                  if (panelId === 'control') {
                    return (
                      <Reorder.Item
                        key="control"
                        value="control"
                        dragListener={false}
                        dragControls={sidebarControlDragControls}
                        className="outline-none"
                      >
                        {isControlFloated
                          ? renderControlPlaceholder({
                            onPointerDown: (e: React.PointerEvent) => sidebarControlDragControls.start(e)
                          })
                          : renderControlDeck(
                            false,
                            () => { },
                            undefined,
                            {
                              onPointerDown: (e: React.PointerEvent) => sidebarControlDragControls.start(e)
                            }
                          )}
                      </Reorder.Item>
                    );
                  }
                  if (panelId === 'spotify') {
                    return (
                      <Reorder.Item
                        key="spotify"
                        value="spotify"
                        dragListener={false}
                        dragControls={sidebarSpotifyDragControls}
                        className="outline-none"
                      >
                        {isSpotifyFloated
                          ? renderSpotifyPlaceholder({
                            onPointerDown: (e: React.PointerEvent) => sidebarSpotifyDragControls.start(e)
                          })
                          : renderSpotifyDeck(
                            false,
                            () => { },
                            undefined,
                            {
                              onPointerDown: (e: React.PointerEvent) => sidebarSpotifyDragControls.start(e)
                            }
                          )}
                      </Reorder.Item>
                    );
                  }
                  return null;
                })}
              </Reorder.Group>

              {/* ── Footer: Telemetry Mode State ── */}
              <div className="mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.15em] text-success-green/60">
                  <div className={`w-1.5 h-1.5 rounded-full ${systemInfo ? 'bg-success-green/60' : 'bg-secondary-txt/30 animate-pulse'
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

