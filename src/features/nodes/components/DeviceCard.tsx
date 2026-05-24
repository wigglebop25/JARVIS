import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cpu, Activity, Power } from 'lucide-react';
import { MetricBar } from '@/components/ui/MetricBar';
import { DevicesData } from '@/types'; 
import { motion } from 'framer-motion';

interface DeviceCardProps {
  device: DevicesData;
  onReboot?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

export const DeviceCard = ({ device, onReboot, onToggleStatus }: DeviceCardProps) => {
  const isOnline = device.status === 'online';

  return (
    <Card 
      glow={isOnline}
      className="group"
      cornerAccents={true}
    >
      <div className="flex flex-col gap-4 py-2">
        
        {/* Custom Header with Toggle Switch */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-sm ${isOnline ? 'bg-success-green shadow-[0_0_8px_#00FF66]' : 'bg-surface-3'}`} />
            <h3 className="text-primary-txt font-mono text-xs font-semibold tracking-wider uppercase">
              {device.name}
            </h3>
          </div>
          
          {/* Custom Toggle Switch */}
          <button 
            onClick={() => onToggleStatus?.(device.id)}
            className={`w-9 h-5 rounded-full relative transition-colors duration-300 border cursor-pointer ${isOnline ? 'bg-success-green/20 border-success-green/50' : 'bg-surface-3/30 border-surface-3'}`}
          >
            <motion.div 
              initial={false}
              animate={{ x: isOnline ? 18 : 2 }}
              className={`w-3.5 h-3.5 rounded-full absolute top-0.5 shadow-lg ${isOnline ? 'bg-success-green shadow-[0_0_10px_#00FF66]' : 'bg-secondary-txt'}`}
            />
          </button>
        </div>

        <MetricBar 
          icon={<Cpu size={12} />} 
          label="CPU Load" 
          value={isOnline ? device.cpu : 0} 
          isWarning={isOnline && device.cpu > 80}
          baseColorClass={isOnline ? "bg-theme-accent text-theme-accent" : "bg-surface-3 text-surface-3"}
        />

        <MetricBar 
          icon={<Activity size={12} />} 
          label="RAM Usage" 
          value={isOnline ? device.ram : 0} 
          baseColorClass={isOnline ? "bg-success-green text-success-green" : "bg-surface-3 text-surface-3"}
        />

        {/* Footer Status & Actions */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-surface-3">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success-green animate-pulse' : 'bg-secondary-txt'}`} />
            <span className="font-mono text-[10px] uppercase text-secondary-txt">{device.status}</span>
          </div>
          
          {/* Action Button: Changes based on status */}
          {isOnline ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onReboot?.(device.id)}
              className="h-7 text-[10px] px-2 cursor-pointer hover:bg-white/5"
            >
              REBOOT
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onToggleStatus?.(device.id)}
              className="h-7 text-[10px] px-2 border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10 cursor-pointer"
            >
              <Power size={10} className="mr-1" /> WAKE (WOL)
            </Button>
          )}
        </div>

      </div>
    </Card>
  );
};