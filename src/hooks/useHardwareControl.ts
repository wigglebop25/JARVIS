import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHardwareState,
  setSystemVolume,
  setVolumeMuted,
  setWifiEnabled,
  setBluetoothEnabled,
  HardwareState,
} from '@/services/hardware.service';

const DEFAULT_STATE: HardwareState = {
  volume: { level: 0, muted: false, available: false },
  wifi: { enabled: false, available: false },
  bluetooth: { enabled: false, available: false },
};

export const useHardwareControl = () => {
  const [hardwareState, setHardwareState] = useState<HardwareState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInteractingRef = useRef(false);

  const setInteracting = useCallback((interacting: boolean) => {
    isInteractingRef.current = interacting;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const state = await getHardwareState();
      if (state) {
        setHardwareState(state);
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }
    } catch {
      setIsSupported(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      if (!isInteractingRef.current) fetchState();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const setVolume = useCallback(async (level: number) => {
    const previous = hardwareState;
    setHardwareState(prev => ({
      ...prev,
      volume: { ...prev.volume, level },
    }));
    const ok = await setSystemVolume(level);
    if (!ok) {
      setHardwareState(previous);
      setError('Failed to set system volume');
    }
  }, [hardwareState]);

  const setMuted = useCallback(async (muted: boolean) => {
    const previous = hardwareState;
    setHardwareState(prev => ({
      ...prev,
      volume: { ...prev.volume, muted },
    }));
    const ok = await setVolumeMuted(muted);
    if (!ok) {
      setHardwareState(previous);
      setError('Failed to set mute state');
    }
  }, [hardwareState]);

  const setWifi = useCallback(async (enabled: boolean) => {
    const previous = hardwareState;
    setHardwareState(prev => ({
      ...prev,
      wifi: { ...prev.wifi, enabled },
    }));
    const ok = await setWifiEnabled(enabled);
    if (!ok) {
      setHardwareState(previous);
      setError('Failed to toggle Wi-Fi');
    }
  }, [hardwareState]);

  const setBluetooth = useCallback(async (enabled: boolean) => {
    const previous = hardwareState;
    setHardwareState(prev => ({
      ...prev,
      bluetooth: { ...prev.bluetooth, enabled },
    }));
    const ok = await setBluetoothEnabled(enabled);
    if (!ok) {
      setHardwareState(previous);
      setError('Failed to toggle Bluetooth');
    }
  }, [hardwareState]);

  return {
    hardwareState,
    isLoading,
    isSupported,
    error,
    clearError,
    setInteracting,
    setVolume,
    setMuted,
    setWifi,
    setBluetooth,
    refresh: fetchState,
  };
};
