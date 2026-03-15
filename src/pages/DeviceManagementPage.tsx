import { motion } from 'framer-motion';
import { systemBootContainer, systemBootItem } from '@/lib/animations';
import { MOCK_DEVICES } from '@/lib/mockData';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Cpu, HardDrive, Activity, Zap } from 'lucide-react';

export const DeviceManagementPage = () => {
  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-mono font-bold text-primary-txt tracking-tighter">
            NODE_CLUSTER_01
          </h1>
          <p className="text-secondary-txt font-mono text-xs uppercase tracking-widest">
            {MOCK_DEVICES.filter(d => d.status === 'online').length} Units Active
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Zap size={14} className="text-jarvis-blue" /> Sync All
        </Button>
      </div>

      {/* The Responsive Grid */}
      <motion.div 
        variants={systemBootContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {MOCK_DEVICES.map((device) => (
          <motion.div key={device.id} variants={systemBootItem}>
            <Card 
              title={device.name} 
              glow={device.status === 'online'}
              className="group"
            >
              <div className="flex flex-col gap-6 py-2">
                
                {/* Hardware Metric Bar: CPU */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Cpu size={12} className="text-jarvis-blue" /> CPU Load
                    </span>
                    <span className={device.cpu > 80 ? "text-error-red" : "text-primary-txt"}>
                      {device.cpu}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${device.cpu}%` }}
                      className={`h-full ${device.cpu > 80 ? 'bg-error-red' : 'bg-jarvis-blue'}`}
                    />
                  </div>
                </div>

                {/* Hardware Metric Bar: RAM */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Activity size={12} className="text-success-green" /> RAM Usage
                    </span>
                    <span>{device.ram}%</span>
                  </div>
                  <div className="h-1 w-full bg-surface-3 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${device.ram}%` }}
                      className="h-full bg-success-green"
                    />
                  </div>
                </div>

                {/* Footer Status */}
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-surface-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-success-green animate-pulse' : 'bg-secondary-txt'}`} />
                    <span className="font-mono text-[10px] uppercase">{device.status}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2">
                    REBOOT
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};