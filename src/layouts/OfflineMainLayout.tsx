import React from 'react';
import { motion } from 'framer-motion';
import { OfflineTitlebar } from '@/components/navigation/OfflineTitlebar';
import { OfflineSidebar } from '@/components/navigation/OfflineSidebar'; 
import { Outlet } from 'react-router-dom'; 
import { SettingsModal } from '@/components/modals/SettingsModal';

export const OfflineMainLayout = () => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-screen bg-offline-bg text-primary-txt font-sans overflow-hidden relative">
      
      {/* --- TECHNICAL HARDWARE LAYER (Replaces Online Blurs) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Subtle Static Grid - Sharper and more dense than online */}
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

        {/* Deep Corner Shadows to focus the center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
      </div>

      {/* --- UI LAYER --- */}
      {/* Sidebar - Using the Offline version with full-bar settings click */}
      <div className="z-20 h-full flex shrink-0">
        <OfflineSidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden z-10 relative">
        {/* Titlebar - Using the hardware telemetry version */}
        <OfflineTitlebar />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Unified Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Note: Global MCP Terminal is usually hidden in "Local Only" mode 
          unless you want it as a secondary debug drawer. Removed for maximum air-gap vibe. */}
    </div>
  );
};