// src/components/modals/SettingsModal.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-base/80 backdrop-blur-md"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-surface-1 border border-surface-3 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-3 bg-surface-2">
              <h2 className="font-mono font-bold text-jarvis-blue">SYSTEM_SETTINGS</h2>
              <button onClick={onClose} className="text-secondary-txt hover:text-primary-txt">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 h-125 overflow-y-auto custom-scrollbar">
              <p className="text-secondary-txt font-mono text-sm">Configure your core protocols...</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};