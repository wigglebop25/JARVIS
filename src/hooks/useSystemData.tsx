import { useState, useEffect, useCallback } from 'react';
import { 
  MOCK_SYSTEM_STATS, MOCK_DEVICES, MOCK_TASKS, 
  MOCK_EVENTS, MOCK_CPU_HISTORY, MOCK_RAM_HISTORY, MOCK_NET_HISTORY 
} from '@/lib/mockData';

export const useSystemData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'online' } : d));
      addEvent(`SYS_ONLINE: ${device.name} RECOVERY_COMPLETE`);
    }, 3000);
  };

  // --- 2. BOOT SEQUENCE ---
  useEffect(() => {
    const boot = async () => {
      await new Promise(r => setTimeout(r, 1200));
      setIsLoading(false);
    };
    boot();
  }, []);

  useEffect(() => {
    if (isLoading || error) return;

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

      setHistory(prev => {
        const lastCpu = prev.cpu[prev.cpu.length - 1].value;
        const lastRam = prev.ram[prev.ram.length - 1].value;
        const lastNet = prev.net[prev.net.length - 1].value;

        const newCpu = Math.min(100, Math.max(0, lastCpu + (Math.floor(Math.random() * 15) - 7)));
        const newRam = Math.min(100, Math.max(0, lastRam + (Math.floor(Math.random() * 5) - 2)));
        const newNet = Math.max(10, lastNet + (Math.floor(Math.random() * 20) - 10));

        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        return {
          cpu: [...prev.cpu.slice(1), { time: timeStr, value: newCpu }],
          ram: [...prev.ram.slice(1), { time: timeStr, value: newRam }],
          net: [...prev.net.slice(1), { time: timeStr, value: newNet }]
        };
      });
    }, 3000); // Ticks every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading, error]);

  return { stats, devices, tasks, events, history, isLoading, error, toggleTask, rebootDevice };
};