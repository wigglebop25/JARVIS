import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

interface StatusTrayProps {
  networkStatus: string;
  onlineCount: number;
  totalDevices: number;
}

export const StatusTray = ({ networkStatus, onlineCount, totalDevices }: StatusTrayProps) => {
  return (
    <motion.div className="flex items-center justify-between py-2 px-4 bg-surface-1/40 backdrop-blur-md border border-white/5 rounded-lg shadow-sm">
      <div className="flex gap-8 items-center">
        <div className="flex items-center gap-2 text-[11px] font-sans font-medium tracking-wider text-primary-txt/60 uppercase">
          <div className="w-1.5 h-1.5 rounded-full bg-success-green shadow-[0_0_5px_#00FF66] animate-pulse" />
          Network: <span className="text-primary-txt font-bold">{networkStatus}</span>
        </div>
        <div className="text-[11px] font-sans font-medium tracking-wider text-primary-txt/60 uppercase">
          Nodes: <span className="text-primary-txt font-bold">{onlineCount} / {totalDevices} Online</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1 bg-surface-2/50 border border-white/5 rounded text-[10px] font-sans font-semibold tracking-widest uppercase text-primary-txt/40">
        <AlertCircle size={12} /> 0 SYSTEM ALERTS
      </div>
    </motion.div>
  );
};
