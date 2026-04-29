// src/context/VoiceContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

type JarvisStatus = 'IDLE' | 'WAKING' | 'LISTENING' | 'THINKING' | 'SPEAKING';

interface VoiceContextType {
  status: JarvisStatus;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<JarvisStatus>('IDLE');
  const [transcript, setTranscript] = useState('');

  // Simulated Porcupine Wake Word Detection
  useEffect(() => {
    console.log("Porcupine Engine: Initialized. Awaiting 'Hey Jarvis'...");
  }, []);

  const startListening = () => {
    setStatus('LISTENING');
    // Mocking a successful transcription after 3 seconds
    setTimeout(() => {
      setTranscript("Jarvis, check system thermals.");
      setStatus('THINKING');
      
      // Simulate MCP Backend Delay
      setTimeout(() => {
        setStatus('SPEAKING');
        setTimeout(() => setStatus('IDLE'), 2000);
      }, 1500);
    }, 3000);
  };

  return (
    <VoiceContext.Provider value={{ status, transcript, startListening, stopListening: () => setStatus('IDLE') }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error("useVoice must be used within VoiceProvider");
  return context;
};