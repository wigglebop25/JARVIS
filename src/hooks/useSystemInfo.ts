import { useEffect, useState } from 'react';
import { getSystemInfo, onTelemetryReceived, SystemInfo } from '@/services/system.service';

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    // Fetch initial cached state immediately
    getSystemInfo().then((info) => {
      if (info) setSystemInfo(info);
    }).catch(console.error);

    // Subscribe to live events via the centralized bus
    const unlisten = onTelemetryReceived((info) => {
      setSystemInfo(info);
    });

    // Clean up subscription on unmount
    return () => {
      unlisten();
    };
  }, []);

  return { systemInfo };
};
