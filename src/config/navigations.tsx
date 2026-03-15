import { LayoutDashboard, Server, Workflow } from 'lucide-react';
import { ReactNode } from 'react'; 

export interface NavItem {
  name: string;
  path: string;
  icon: ReactNode; 
}

export const navigations: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { name: 'Device Management', path: '/device', icon: <Server size={20} /> },
  { name: 'Automations', path: '/automations', icon: <Workflow size={20} /> },
];