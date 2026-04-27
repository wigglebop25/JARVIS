import { useState } from 'react';
import { motion } from 'framer-motion';
import { systemBootContainer, systemBootItem } from '@/lib/animations';
import { Button } from '@/components/ui/Button';
import { Zap, Plus } from 'lucide-react';
import { DeviceCard } from '@/features/nodes/components/DeviceCard';
import { LinkDeviceModal } from '@/components/modals/LinkDeviceModal';
import { useSystemData } from '@/hooks/useSystemData'; 

export const DeviceManagementPage = () => {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  
  // Grab the devices array AND the addDevice function from the hook
  const { devices, addDevice } = useSystemData(); 
  
  const activeCount = devices.filter(d => d.status === 'online').length;

  return (
    <div className="flex flex-col gap-6 h-full relative">
      
      {/* Header Info & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-mono font-bold text-primary-txt tracking-tighter">
            NODE_CLUSTER_01
          </h1>
          <p className="text-secondary-txt font-mono text-xs uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success-green shadow-[0_0_8px_#00FF66] animate-pulse" />
            {activeCount} Units Active
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="primary" size="sm" onClick={() => setIsLinkModalOpen(true)}>
            <Plus size={14} /> Link Device
          </Button>
          <Button variant="outline" size="sm">
            <Zap size={14} className="text-jarvis-blue" /> Sync All
          </Button>
        </div>
      </div>

      {/* The Responsive Grid */}
      <motion.div 
        variants={systemBootContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        {devices.map((device) => (
          <motion.div key={device.id} variants={systemBootItem}>
            <DeviceCard device={device} />
          </motion.div>
        ))}
      </motion.div>

      {/* The Modal */}
      <LinkDeviceModal 
        isOpen={isLinkModalOpen} 
        onClose={() => setIsLinkModalOpen(false)} 
        onDeviceAdd={addDevice} 
      />

    </div>
  );
};