import { useState, useRef, useEffect, useCallback } from 'react';
import { countTokens } from '@/services/chatService';

interface UseTokenCountReturn {
  tokens: number;
  isCalculating: boolean;
  update: (text: string) => void;
}

export const useTokenCount = (): UseTokenCountReturn => {
  const [tokens, setTokens] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const update = useCallback((text: string) => {
    if (!text.trim()) {
      setTokens(0);
      setIsCalculating(false);
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
      return;
    }

    setIsCalculating(true);

    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await countTokens(text);
        setTokens(res.prompt_tokens);
      } catch (err) {
        console.error("Failed to count tokens:", err);
      } finally {
        setIsCalculating(false);
      }
    }, 300);
  }, []);

  return { tokens, isCalculating, update };
};
