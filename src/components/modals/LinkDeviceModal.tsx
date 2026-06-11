import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Hash, Shield, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeviceFormData {
  name: string;
  ip: string;
  mac: string;
  key: string;
}

interface LinkDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceAdd: (deviceData: DeviceFormData) => void;
}

export const LinkDeviceModal = ({ isOpen, onClose, onDeviceAdd }: LinkDeviceModalProps) => {
  const [formData, setFormData] = useState({ name: '', ip: '', mac: '', key: '' });
  const [errors, setErrors] = useState({ name: '', ip: '', mac: '', key: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', ip: '', mac: '', key: '' });
      setErrors({ name: '', ip: '', mac: '', key: '' });
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', ip: '', mac: '', key: '' };

    if (!formData.name.trim()) {
      newErrors.name = 'SYS_ERR: Node Identifier is required.';
      isValid = false;
    }

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(formData.ip)) {
      newErrors.ip = 'SYS_ERR: Invalid IPv4 format detected.';
      isValid = false;
    }

    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(formData.mac)) {
      newErrors.mac = 'SYS_ERR: Invalid Physical MAC formatting.';
      isValid = false;
    }

    if (formData.key.length < 8) {
      newErrors.key = 'SYS_ERR: Handshake protocol requires 8+ characters.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInitiate = () => {
    if (validateForm()) {
      setIsSubmitting(true);
      setTimeout(() => {
        onDeviceAdd(formData);
        setIsSubmitting(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-base/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-surface-1/60 backdrop-blur-xl border border-theme-accent/30 rounded-xl shadow-[0_0_40px_rgba(var(--theme-accent-rgb),0.1)] overflow-hidden"
          >
            {/* HUD Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-theme-accent/50 rounded-tl-xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-theme-accent/50 rounded-br-xl pointer-events-none" />

            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-surface-2/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded border border-theme-accent/50 bg-theme-accent/10 flex items-center justify-center text-theme-accent shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.2)]">
                  <Server size={16} />
                </div>
                <div>
                  <h2 className="font-mono font-bold text-primary-txt tracking-wide">ESTABLISH_UPLINK</h2>
                  <p className="text-[10px] font-mono text-theme-accent uppercase tracking-widest">Register New Hardware Node</p>
                </div>
              </div>
              <button onClick={onClose} className="text-secondary-txt hover:text-error-red transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              
              {/* Node Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-secondary-txt uppercase tracking-widest flex items-center gap-2">
                  <Server size={12} /> Node Identifier
                </label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. CORE_SERVER_02" 
                  className={`w-full bg-surface-2/50 border rounded px-4 py-2.5 text-sm font-mono text-primary-txt focus:outline-none transition-all placeholder:text-surface-3 
                    ${errors.name ? 'border-error-red focus:shadow-[0_0_10px_rgba(255,51,51,0.2)]' : 'border-surface-3 focus:border-theme-accent/50 focus:shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.1)]'}`}
                />
                {errors.name && <span className="text-error-red text-[10px] font-mono uppercase flex items-center gap-1"><AlertTriangle size={10} /> {errors.name}</span>}
              </div>

              {/* IP Address */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-secondary-txt uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} /> Local IPv4 Address
                </label>
                <input 
                  type="text" 
                  value={formData.ip}
                  onChange={(e) => setFormData({...formData, ip: e.target.value})}
                  placeholder="192.168.1.xxx" 
                  className={`w-full bg-surface-2/50 border rounded px-4 py-2.5 text-sm font-mono text-primary-txt focus:outline-none transition-all placeholder:text-surface-3 
                    ${errors.ip ? 'border-error-red focus:shadow-[0_0_10px_rgba(255,51,51,0.2)]' : 'border-surface-3 focus:border-theme-accent/50 focus:shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.1)]'}`}
                />
                {errors.ip && <span className="text-error-red text-[10px] font-mono uppercase flex items-center gap-1"><AlertTriangle size={10} /> {errors.ip}</span>}
              </div>

              {/* MAC Address */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-secondary-txt uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12} className={errors.mac ? "text-error-red" : "text-theme-accent"} /> Physical MAC Address <span className="text-[9px] text-surface-3">(Required for WoL)</span>
                </label>
                <input 
                  type="text" 
                  value={formData.mac}
                  onChange={(e) => setFormData({...formData, mac: e.target.value.toUpperCase()})}
                  placeholder="00:1A:2B:3C:4D:5E" 
                  className={`w-full bg-surface-2/50 border rounded px-4 py-2.5 text-sm font-mono text-primary-txt uppercase focus:outline-none transition-all placeholder:text-surface-3 
                    ${errors.mac ? 'border-error-red focus:shadow-[0_0_10px_rgba(255,51,51,0.2)]' : 'border-surface-3 focus:border-theme-accent/50 focus:shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.1)]'}`}
                />
                {errors.mac && <span className="text-error-red text-[10px] font-mono uppercase flex items-center gap-1"><AlertTriangle size={10} /> {errors.mac}</span>}
              </div>

              {/* Auth Key */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-secondary-txt uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Handshake Protocol Key
                </label>
                <input 
                  type="password" 
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  placeholder="••••••••••••••••" 
                  className={`w-full bg-surface-2/50 border rounded px-4 py-2.5 text-sm font-mono text-primary-txt focus:outline-none transition-all placeholder:text-surface-3 
                    ${errors.key ? 'border-error-red focus:shadow-[0_0_10px_rgba(255,51,51,0.2)]' : 'border-surface-3 focus:border-theme-accent/50 focus:shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.1)]'}`}
                />
                {errors.key && <span className="text-error-red text-[10px] font-mono uppercase flex items-center gap-1"><AlertTriangle size={10} /> {errors.key}</span>}
              </div>

            </div>

            <div className="p-5 border-t border-white/5 bg-surface-2/20 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose} className="border border-transparent hover:border-surface-3">
                CANCEL
              </Button>
              <Button 
                variant="primary" 
                onClick={handleInitiate}
                className={`shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.3)] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'VERIFYING...' : 'INITIATE UPLINK'}
              </Button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};