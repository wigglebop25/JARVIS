import { DevicesData, SystemData } from '@/types';

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
  avgRamUsage: 68
};

export const MOCK_SYSTEM_UTILITIES = {
    batteryData: 85,
    timeData: '10:30'
}