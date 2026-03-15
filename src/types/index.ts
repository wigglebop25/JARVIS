export interface DevicesData {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  storage: number;
  network: string;
  status: 'online' | 'offline';
}

export interface SystemData {
  totalDevices: number;
  onlineDevices: number;
  activeAutomations: number;
  networkStatus: string;
  avgCpuUsage: number;
  avgRamUsage: number;
}