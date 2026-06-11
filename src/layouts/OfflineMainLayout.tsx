import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfflineTitlebar } from '@/components/navigation/OfflineTitlebar';
import { OfflineSidebar } from '@/components/navigation/OfflineSidebar'; 
import { Outlet } from 'react-router-dom'; 
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useVoice } from '@/context/VoiceContext';
import { VoiceStatusOrb } from '@/features/chat';
import { SessionProvider } from '@/context/SessionContext';

export const OfflineMainLayout = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { status } = useVoice();

  return (
    <SessionProvider>
    <div className="flex h-screen w-screen bg-offline-bg text-primary-txt font-sans overflow-hidden relative">
      
      {/* --- TECHNICAL HARDWARE LAYER --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Technical Grid Overlay */}
        <div className="grid-overlay" />

        {/* Moving Technical Scanline */}
        <motion.div 
          animate={{ y: [0, 600, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ willChange: 'transform' }}
          className="absolute inset-0 opacity-[0.015] bg-gradient-to-b from-transparent via-offline-core to-transparent h-32 w-full will-change-transform"
        />

        {/* Subtle Dark Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
      </div>

      {/* --- UI LAYER --- */}
      <div className="z-20 h-full flex shrink-0">
        <OfflineSidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden z-10 relative">
        <OfflineTitlebar />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* --- UNIFIED SETTINGS MODAL --- */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* --- COMPACT VOICE STATUS STRIP (replaces fullscreen overlay) --- */}
      <AnimatePresence>
        {status === 'LISTENING' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="fixed top-14 left-0 right-0 z-[60] flex items-center justify-center pointer-events-none"
          >
            <div className="flex items-center gap-3 px-5 py-2 bg-offline-surface-dark/90 border border-offline-core/30 rounded-b-xl shadow-[0_4px_20px_rgba(244,244,245,0.08)]">
              <div className="w-2 h-2 rounded-full bg-offline-core shadow-[0_0_8px_var(--color-offline-core)] animate-pulse" />
              <span className="text-[9px] font-mono text-offline-core uppercase tracking-[0.25em] font-bold animate-pulse">
                Voice_Uplink_Active
              </span>
              <div className="scale-[0.3] origin-center">
                <VoiceStatusOrb />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </SessionProvider>
  );
};