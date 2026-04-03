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

  // --- INTERACTIVE ACTIONS ---

  const addEvent = useCallback((title: string) => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
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
    
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'offline', cpu: 0, ram: 0 } : d));

    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, status: 'online' } : d));
      addEvent(`SYS_ONLINE: ${device.name} RECOVERY_COMPLETE`);
    }, 3000);
  };

  useEffect(() => {
    const boot = async () => {
      await new Promise(r => setTimeout(r, 1200));
      setIsLoading(false);
    };
    boot();
  }, []);

  return { stats, devices, tasks, events, history, isLoading, error, toggleTask, rebootDevice };
};