import { useEffect, useRef } from 'react';

type VoiceStatus = 'IDLE' | 'WAKING' | 'LISTENING' | 'THINKING' | 'SPEAKING';

interface UseAutoSendTranscriptOptions {
  status: VoiceStatus;
  transcript: string;
  onSend: (transcript: string) => void;
  shouldSendWhenListening?: boolean;
}

export const useAutoSendTranscript = ({
  status,
  transcript,
  onSend,
  shouldSendWhenListening = true,
}: UseAutoSendTranscriptOptions) => {
  const lastProcessedTranscript = useRef('');

  useEffect(() => {
    if (transcript && transcript !== lastProcessedTranscript.current) {
      lastProcessedTranscript.current = transcript;

      if (shouldSendWhenListening && status === 'LISTENING') {
        onSend(transcript);
      }
    }
  }, [transcript, status, onSend, shouldSendWhenListening]);
};
