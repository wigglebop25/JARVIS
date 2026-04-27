import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cpu, Activity, Power } from 'lucide-react';
import { MetricBar } from '@/components/ui/MetricBar';
import { DevicesData } from '@/types'; 

interface DeviceCardProps {
  device: DevicesData;
}

export const DeviceCard = ({ device }: DeviceCardProps) => {
  const isOnline = device.status === 'online';

  return (
    <Card 
      title={device.name} 
      glow={isOnline}
      className="group"
    >
      <div className="flex flex-col gap-6 py-2">
        
        <MetricBar 
          icon={<Cpu size={12} />} 
          label="CPU Load" 
          value={device.cpu} 
          isWarning={device.cpu > 80}
          baseColorClass="bg-jarvis-blue text-jarvis-blue"
        />

        <MetricBar 
          icon={<Activity size={12} />} 
          label="RAM Usage" 
          value={device.ram} 
          baseColorClass="bg-success-green text-success-green"
        />

        {/* Footer Status & Actions */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-surface-3">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-success-green animate-pulse' : 'bg-secondary-txt'}`} />
            <span className="font-mono text-[10px] uppercase">{device.status}</span>
          </div>
          
          {/* Action Button: Changes based on status */}
          {isOnline ? (
            <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">
              REBOOT
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 border-jarvis-blue/50 text-jarvis-blue hover:bg-jarvis-blue/10">
              <Power size={10} /> WAKE (WOL)
            </Button>
          )}
        </div>

      </div>
    </Card>
  );
};