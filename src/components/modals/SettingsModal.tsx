import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Globe, Cpu, Palette, RefreshCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const currentMode = sessionStorage.getItem('jarvis_mode') || 'online';

  const handleSwitchMode = () => {
    // Clear session and trigger the selection event
    sessionStorage.removeItem('jarvis_mode');
    onClose();
    window.dispatchEvent(new Event('go-to-selection'));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-3xl h-[500px] border rounded-xl overflow-hidden shadow-2xl flex flex-col
              ${currentMode === 'offline' ? 'border-offline-border bg-offline-bg' : 'border-jarvis-blue/30 bg-base'}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h2 className={`font-mono font-bold tracking-widest text-sm
                ${currentMode === 'offline' ? 'text-offline-core' : 'text-jarvis-blue'}
              `}>
                SYSTEM_SETTINGS // {currentMode.toUpperCase()}_LOG
              </h2>
              <button onClick={onClose} className="text-secondary-txt hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar (Settings Navigation) */}
              <div className="w-48 border-r border-white/5 p-4 flex flex-col gap-2">
                 <SettingsTab icon={<Cpu size={14}/>} label="General" active />
                 <SettingsTab icon={<Palette size={14}/>} label="Interface" />
              </div>

              {/* Right Content */}
              <div className="flex-1 p-6 space-y-8 overflow-y-auto custom-scrollbar">
                
                {/* 🚀 MODE SWITCH SECTION (The new Menu logic) */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-mono text-secondary-txt uppercase tracking-[0.3em]">Operation_Protocol</h3>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${currentMode === 'offline' ? 'bg-offline-core/10 text-offline-core' : 'bg-jarvis-blue/10 text-jarvis-blue'}`}>
                        {currentMode === 'offline' ? <Shield size={20} /> : <Globe size={20} />}
                      </div>
                      <div>
                        <p className="text-xs font-mono text-primary-txt uppercase">
                          Current Mode: <span className="font-bold">{currentMode}</span>
                        </p>
                        <p className="text-[10px] text-secondary-txt font-mono mt-1">
                          {currentMode === 'offline' ? 'Air-Gapped / Local Processing' : 'Cloud Synchronized / Neural Uplink'}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleSwitchMode}
                      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all group"
                    >
                      <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Reboot_Selector</span>
                    </button>
                  </div>
                </section>

                <section>
                   <p className="text-[10px] font-mono text-secondary-txt opacity-30 italic">End of current sequence...</p>
                </section>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const SettingsTab = ({ icon, label, active = false }: any) => (
  <div className={`flex items-center gap-3 px-3 py-2 rounded-md font-mono text-[10px] uppercase tracking-widest cursor-pointer transition-all
    ${active ? 'bg-white/10 text-white border-l-2 border-current shadow-sm' : 'text-secondary-txt hover:bg-white/5'}
  `}>
    {icon}
    {label}
  </div>
);