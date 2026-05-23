import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as voiceService from '@/services/voiceService';

type JarvisStatus = 'IDLE' | 'WAKING' | 'LISTENING' | 'THINKING' | 'SPEAKING';

interface VoiceContextType {
  status: JarvisStatus;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  setStatus: (status: JarvisStatus) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<JarvisStatus>('IDLE');
  const [transcript, setTranscript] = useState('');

  // Sync status on mount
  useEffect(() => {
    const sync = async () => {
      try {
        const active = await voiceService.getVoiceStatus();
        if (active) setStatus('LISTENING');
      } catch (err) {
        console.error("Voice sync error:", err);
      }
    };
    sync();
  }, []);

  // Listen for real transcripts from Tauri
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setup = async () => {
      unlisten = await voiceService.onTranscriptReceived((text) => {
        setTranscript(text);
        setStatus('IDLE'); // Backend usually stops after emitting
      });
    };

    setup();
    return () => { if (unlisten) unlisten(); };
  }, []);

  const startListening = useCallback(async () => {
    setStatus('WAKING');
    setTranscript('');
    try {
      const success = await voiceService.startVoiceListener();
      if (success) {
        setStatus('LISTENING');
      } else {
        setStatus('IDLE');
      }
    } catch (err) {
      console.error("Failed to start voice:", err);
      setStatus('IDLE');
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await voiceService.stopVoiceListener();
      setStatus('IDLE');
    } catch (err) {
      console.error("Failed to stop voice:", err);
    }
  }, []);

  return (
    <VoiceContext.Provider value={{ status, transcript, startListening, stopListening, setStatus }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error("useVoice must be used within VoiceProvider");
  return context;
};