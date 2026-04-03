export interface DevicesData {
  id: string;
  name: string;
  cpu: number;
  ram: number;
  storage: number;
  network: string;
  status: 'online' | 'offline';
  ip?: string;
  mac?: string;
}

export interface SystemData {
  totalDevices: number;
  onlineDevices: number;
  activeAutomations: number;
  networkStatus: string;
  avgCpuUsage: number;
  avgRamUsage: number;
  systemAlerts: number;
}
export interface RoutineData {
  id: string;
  name: string;
  triggerType: 'time' | 'device' | 'command';
  triggerValue: string; // e.g., "08:00 AM" or "CPU > 90%"
  actionTarget: string; // e.g., "Main Server" or "Living Room Hub"
  actionType: string; // e.g., "Wake", "Reboot", "Notify"
  isActive: boolean;
}