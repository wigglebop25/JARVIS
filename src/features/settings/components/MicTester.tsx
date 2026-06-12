import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

export const MicTester = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Continuous measurement loop — runs while isTesting && stream
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId = 0;

    if (isTesting && streamRef.current) {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error('Web Audio API is not supported in this environment.');
        }

        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(streamRef.current);
        source.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const scaledLevel = Math.min(100, Math.round((average / 120) * 100));
          setMicLevel(scaledLevel);
          animationFrameId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to initialize audio context.';
        console.error('Mic test setup error:', message);
        setMicError(message);
        setIsTesting(false);
      }
    } else {
      setMicLevel(0);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) audioContext.close().catch(console.error);
    };
  }, [isTesting]);

  const toggleMicTest = async () => {
    setMicError(null);
    if (isTesting) {
      cleanup();
      setIsTesting(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone access is not supported or blocked by WebView permissions.');
        }
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = micStream;
        setIsTesting(true);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Microphone access denied. Check system permissions.';
        console.error('Failed mic stream capture:', message);
        setMicError(message);
      }
    }
  };

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-5 space-y-4 hover:border-white/10 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-xs font-sans font-bold text-primary-txt uppercase tracking-wider">
            Voice Test Console
          </h4>
          <p className="text-[11px] font-sans text-tertiary-txt">
            Real hardware feed to safely test microphone input level.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMicTest}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer ${
            isTesting
              ? 'bg-error-red/10 text-error-red border border-error-red/30 shadow-[0_0_15px_rgba(255,0,0,0.15)] animate-pulse'
              : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 hover:bg-[var(--theme-accent)]/20 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.15)]'
          }`}
        >
          {isTesting ? <MicOff size={14} /> : <Mic size={14} />}
          {isTesting ? 'Stop Test' : 'Start Test'}
        </button>
      </div>

      {micError && (
        <div className="text-xs font-sans text-error-red bg-error-red/10 px-3 py-2 rounded-md border border-error-red/20">
          [ERROR]: {micError}
        </div>
      )}

      {/* Level Indicator Bar */}
      <div className="space-y-2.5">
        <div className="flex justify-between text-[11px] font-sans text-secondary-txt/80">
          <span>HARDWARE INPUT LEVEL</span>
          <span
            className={
              isTesting
                ? 'text-success-green font-bold drop-shadow-[0_0_8px_#00FF66] transition-all'
                : 'text-tertiary-txt transition-all'
            }
          >
            {isTesting ? 'TESTING // ACTIVE' : 'INACTIVE // CLICK START'}
          </span>
        </div>

        <div className="relative h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className={`h-full transition-all duration-75 ${
              isTesting
                ? 'bg-gradient-to-r from-success-green to-success-green/80 shadow-[0_0_10px_#00FF66]'
                : 'bg-[var(--theme-accent)]'
            }`}
            style={{ width: `${isTesting ? micLevel : 0}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-tertiary-txt/60">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
