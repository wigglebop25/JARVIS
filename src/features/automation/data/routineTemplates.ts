import { RoutineData } from '@/types';

export const ROUTINE_TEMPLATES: Omit<RoutineData, 'id'>[] = [
  {
    name: 'Database Backup Sync',
    triggerType: 'time',
    triggerValue: '02:00 AM',
    actionTarget: 'Offsite Storage',
    actionType: 'Rsync Backup',
    isActive: true,
  },
  {
    name: 'AI Agent Memory Consolidation',
    triggerType: 'command',
    triggerValue: 'memory_consolidate',
    actionTarget: 'Vector Store',
    actionType: 'Optimize Indices',
    isActive: true,
  },
  {
    name: 'Intrusion Detection Sweep',
    triggerType: 'device',
    triggerValue: 'Perimeter Breach',
    actionTarget: 'Security Cluster',
    actionType: 'Lock Access Points',
    isActive: false,
  }
];
