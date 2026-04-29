import { useState, useEffect, useRef } from 'react';

export const useNeuralFrequency = (isActive: boolean) => {
  const [frequencyData, setFrequencyData] = useState<number>(0);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null); 

  useEffect(() => {
    if (!isActive) {
      setFrequencyData(0); 
      return;
    }

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx.current = new AudioContext();
        analyser.current = audioCtx.current.createAnalyser();
        const source = audioCtx.current.createMediaStreamSource(stream);
        source.connect(analyser.current);
        analyser.current.fftSize = 64;

        const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
        
        const animate = () => {
          if (!analyser.current) return;
          analyser.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setFrequencyData(average);
          animationRef.current = requestAnimationFrame(animate);
        };
        animate();
      } catch (err) {
        console.error("Microphone access denied or AudioContext failed:", err);
      }
    };

    startAudio();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        audioCtx.current.close();
      }
    };
  }, [isActive]);

  return frequencyData;
};