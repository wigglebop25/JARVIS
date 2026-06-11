import { Clock, Terminal, Server, Power } from 'lucide-react';

export const getTriggerIcon = (type: string, size: number = 18) => {
  switch (type) {
    case 'time': return <Clock size={size} />;
    case 'command': return <Terminal size={size} />;
    case 'device': return <Server size={size} />;
    default: return <Power size={size} />;
  }
};
