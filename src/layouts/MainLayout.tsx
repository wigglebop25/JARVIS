import React from 'react';
import { motion } from 'framer-motion';
import { Titlebar } from '@/components/Titlebar';
import { Sidebar } from '@/components/Sidebar'; 
import { Outlet } from 'react-router-dom'; 
import { SettingsModal } from '@/components/modals/SettingsModal';
import { MCPTerminal } from '@/features/mcp/components/MCPterminal'; 

export const MainLayout = () => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-screen bg-base text-primary-txt font-sans overflow-hidden relative">
      
      {/* --- THE BULLETPROOF MOVING BACKGROUND --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-jarvis-blue opacity-20 blur-[100px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, -70, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-success-green opacity-10 blur-[100px]" 
        />
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-blue-600 opacity-10 blur-[120px]" 
        />
        <motion.div 
          animate={{ y: [0, -32] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]"
        />
      </div>

      {/* --- UI LAYER --- */}
      <div className="z-20 h-full flex shrink-0">
        <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden z-10 relative">
        <Titlebar />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* --- GLOBAL MCP TERMINAL --- */}
      <MCPTerminal />

    </div>
  );
};