import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OfflineTitlebar } from '@/components/navigation/OfflineTitlebar';
import { OfflineSidebar } from '@/components/navigation/OfflineSidebar'; 
import { Outlet } from 'react-router-dom'; 
import { SettingsModal } from '@/components/modals/SettingsModal';
import { useVoice } from '@/context/VoiceContext';
import { NeuralCore } from '@/features/mcp/components/NeuralCore';

export const OfflineMainLayout = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { status } = useVoice();

  return (
    <div className="flex h-screen w-screen bg-offline-bg text-primary-txt font-sans overflow-hidden relative">
      
      {/* --- TECHNICAL HARDWARE LAYER --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle Static Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ 
            backgroundImage: `radial-gradient(var(--color-offline-core) 1px, transparent 1px)`,
            backgroundSize: '24px 24px' 
          }} 
        />

        {/* Moving Technical Scanline */}
        <motion.div 
          animate={{ y: [0, 500, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-[0.02] bg-gradient-to-b from-transparent via-offline-core to-transparent h-40 w-full"
        />

        {/* Deep Corner Shadows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
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

      {/* --- 🏛️ GLOBAL OFFLINE VOICE OVERLAY --- */}
      {/* This sits at z-[110] to cover the Sidebar, Titlebar, and Dashboard when active */}
      <AnimatePresence>
        {status === 'LISTENING' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center pointer-events-none"
          >
            <div className="flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="mb-8"
              >
                <NeuralCore />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};