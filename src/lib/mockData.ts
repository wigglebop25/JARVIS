import { DevicesData, SystemData, RoutineData } from '@/types';

export const MOCK_SYSTEM_UTILITIES = {
    batteryData: 85,
    timeData: '10:30'
}

export const MOCK_ROUTINES: RoutineData[] = [
  {
    id: 'rt-01',
    name: 'Morning Systems Boot',
    triggerType: 'time',
    triggerValue: '06:00 AM',
    actionTarget: 'Living Room Hub',
    actionType: 'Wake (WOL)',
    isActive: true,
  },
  {
    id: 'rt-02',
    name: 'Thermal Throttle Protection',
    triggerType: 'device',
    triggerValue: 'Main Server CPU > 85%',
    actionTarget: 'Main Server',
    actionType: 'Spin up Cooling Fans',
    isActive: true,
  },
  {
    id: 'rt-03',
    name: 'Emergency Lockdown',
    triggerType: 'command',
    triggerValue: 'Manual Override',
    actionTarget: 'All Nodes',
    actionType: 'Halt Processes',
    isActive: false,
  }
];

// Dashboard data

export const MOCK_DEVICES: DevicesData[] = [
  { id: 'node-01', name: 'Main Server', cpu: 45, ram: 60, storage: 80, network: '12 Mb/s', status: 'online' },
  { id: 'node-02', name: 'Living Room Hub', cpu: 12, ram: 30, storage: 45, network: '2 Mb/s', status: 'online' },
  { id: 'node-03', name: 'Garage Camera', cpu: 0, ram: 0, storage: 0, network: '0 Mb/s', status: 'offline' },
];

export const MOCK_SYSTEM_STATS: SystemData = {
  totalDevices: 12,
  onlineDevices: 10,
  activeAutomations: 5,
  networkStatus: "Operational",
  avgCpuUsage: 42,
  avgRamUsage: 68,
  systemAlerts: 0
};

export const MOCK_TASKS = [
  { id: 't1', title: 'Compile Kernel Updates', status: 'active', progress: 45 },
  { id: 't2', title: 'Sync Offsite Backups', status: 'pending', progress: 0 },
  { id: 't3', title: 'Purge Temp Logs', status: 'completed', progress: 100 },
];

export const MOCK_EVENTS = [
  { id: 'e1', time: '14:00', title: 'Routine Node Maintenance' },
  { id: 'e2', time: '18:30', title: 'Automated Security Scan' },
  { id: 'e3', time: '23:59', title: 'Daily Telemetry Upload' },
];

// Mock data points for a network graph (0 to 100 scale)
export const MOCK_NETWORK_DATA = [20, 35, 40, 25, 45, 60, 85, 55, 40, 65, 75, 50, 45, 30, 20, 35, 25, 15, 30, 45];

export const MOCK_CPU_HISTORY = [
  { time: '0m', value: 25 }, { time: '5m', value: 40 }, { time: '10m', value: 30 }, 
  { time: '15m', value: 65 }, { time: '20m', value: 45 }, { time: '25m', value: 90 }, 
  { time: '30m', value: 65 }, { time: '35m', value: 78 }, { time: '40m', value: 40 }, 
  { time: '45m', value: 60 }, { time: '50m', value: 35 }
];

export const MOCK_RAM_HISTORY = [
  { time: '0m', value: 20 }, { time: '10m', value: 35 }, { time: '20m', value: 40 }, 
  { time: '30m', value: 60 }, { time: '40m', value: 65 }, { time: '50m', value: 85 }
];

export const MOCK_NET_HISTORY = [
  { time: '10m', value: 30 }, { time: '8m', value: 50 }, { time: '6m', value: 45 }, 
  { time: '4m', value: 80 }, { time: '2m', value: 55 }, { time: '0m', value: 40 }
];