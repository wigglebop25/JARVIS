import { useState, useEffect, useCallback } from 'react';
import { onTelemetryReceived } from '@/services/system.service';
import { 
  MOCK_SYSTEM_STATS, MOCK_DEVICES, MOCK_TASKS, 
  MOCK_EVENTS, MOCK_CPU_HISTORY, MOCK_RAM_HISTORY, MOCK_NET_HISTORY 
} from '@/lib/mockData';

export const useSystemData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);
  
  const [stats, setStats] = useState(MOCK_SYSTEM_STATS);
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [history, setHistory] = useState({
    cpu: MOCK_CPU_HISTORY, ram: MOCK_RAM_HISTORY, net: MOCK_NET_HISTORY
  });

  // --- 1. INTERACTIVE ACTIONS ---

  const addEvent = useCallback((title: string) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setEvents(prev => [{ id: Date.now().toString(), time: timeStr, title }, ...prev.slice(0, 9)]);
  }, []);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'active' : 'completed';
        addEvent(`TASK_UPDATE: ${task.title} -> ${newStatus.toUpperCase()}`);
        return { ...task, status: newStatus, progress: newStatus === 'completed' ? 100 : 45 };
      }
      return task;
    }));
  };

  const rebootDevice = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    addEvent(`SYS_REBOOT_INITIATED: ${device.name}`);
    
    // Set to offline
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'offline', cpu: 0, ram: 0 } : d));

    // Bring back online after 3 seconds
    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'online', cpu: 20, ram: 30 } : d));
      addEvent(`SYS_ONLINE: ${device.name} RECOVERY_COMPLETE`);
    }, 3000);
  };

  const toggleDeviceStatus = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    const willBeOnline = device.status === 'offline';
    const newStatus = willBeOnline ? 'online' : 'offline';
    
    addEvent(`NODE_STATUS_CHANGE: ${device.name} -> ${newStatus.toUpperCase()}`);
    
    setDevices(prev => prev.map(d => {
      if (d.id === deviceId) {
        return { 
          ...d, 
          status: newStatus,
          cpu: willBeOnline ? Math.floor(Math.random() * 30) + 15 : 0, 
          ram: willBeOnline ? Math.floor(Math.random() * 25) + 20 : 0 
        };
      }
      return d;
    }));
  };

  const addDevice = useCallback((device: any) => {
    setDevices(prev => [...prev, device]);
    addEvent(`DEVICE_ADDED: ${device.name}`);
  }, [addEvent]);

  // --- 2. BOOT SEQUENCE & TELEMETRY SUBSCRIBER ---
  useEffect(() => {
    const unlisten = onTelemetryReceived((info) => {
      // 1. Update overall average statistics
      setStats((prev) => ({
        ...prev,
        avgCpuUsage: Math.round(info.cpu_usage),
        avgRamUsage: Math.round(info.ram_usage),
      }));

      // 2. Append to rolling chart histories
      setHistory((prev) => {
        const timeStr = new Date(info.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });

        return {
          cpu: [...prev.cpu.slice(1), { time: timeStr, value: Math.round(info.cpu_usage) }],
          ram: [...prev.ram.slice(1), { time: timeStr, value: Math.round(info.ram_usage) }],
          net: prev.net, // net traffic not yet provided by backend
        };
      });

      // 3. Mark loading complete on first telemetry packet
      setIsLoading(false);
    });

    // If no telemetry arrives (non-Tauri env), stop loading after a timeout
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearTimeout(loadingTimeout);
      unlisten();
    };
  }, []);

  // --- 3. FLEET DEVICES SIMULATED FLUCTUATION ---
  // Gated behind a flag; only runs in dev or when explicitly enabled.
  const isSimulatorEnabled = typeof window !== 'undefined' && (window as any).__ENABLE_DEVICE_SIMULATOR__;
  useEffect(() => {
    if (isLoading || error || !isSimulatorEnabled) return;

    const interval = setInterval(() => {
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.status === 'offline') return device; // Don't twitch offline nodes
          const cpuFluctuation = Math.floor(Math.random() * 11) - 5;
          const ramFluctuation = Math.floor(Math.random() * 5) - 2;
          return {
            ...device,
            cpu: Math.min(100, Math.max(0, device.cpu + cpuFluctuation)),
            ram: Math.min(100, Math.max(0, device.ram + ramFluctuation)),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, error]);

  return { stats, devices, tasks, events, history, isLoading, error, toggleTask, rebootDevice, toggleDeviceStatus, addDevice };
};