import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

export const MicTester = () => {
  const [micTestResult, setMicTestResult] = useState<'idle' | 'testing' | 'pass' | 'fail'>('idle');
  const [micLevel, setMicLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startMicTest = async () => {
    setMicTestResult('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 128;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let samples = 0;
      let totalLevel = 0;
      const measure = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        totalLevel += avg;
        samples++;
        setMicLevel(avg);
        if (samples < 20) {
          animFrameRef.current = requestAnimationFrame(measure);
        } else {
          const finalAvg = totalLevel / samples;
          setMicTestResult(finalAvg > 5 ? 'pass' : 'fail');
          cleanup();
        }
      };
      measure();
    } catch {
      setMicTestResult('fail');
      cleanup();
    }
  };

  const cleanup = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  useEffect(() => cleanup, []);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={startMicTest}
        disabled={micTestResult === 'testing'}
        className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
      >
        {micTestResult === 'testing' ? (
          <span className="flex items-center gap-1.5">
            <MicOff size={12} className="animate-pulse" /> Testing...
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Mic size={12} /> Test_Microphone
          </span>
        )}
      </button>
      {micTestResult === 'testing' && (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`w-1.5 h-4 rounded-full transition-all ${micLevel > i * 20 ? 'bg-offline-core' : 'bg-white/10'}`} style={{ height: `${Math.min(16, micLevel / 5)}px` }} />
          ))}
        </div>
      )}
      {micTestResult === 'pass' && <span className="text-[10px] font-mono text-success-green">Mic_OK</span>}
      {micTestResult === 'fail' && <span className="text-[10px] font-mono text-error-red">Mic_Error</span>}
    </div>
  );
};
