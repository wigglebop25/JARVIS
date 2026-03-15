import React from 'react';
import { Titlebar } from '@/components/Titlebar';
import { Sidebar } from '@/components/Sidebar'; 
import { Outlet } from 'react-router-dom'; 
import { SettingsModal } from '@/components/modals/SettingsModal'

export const MainLayout = () => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-screen bg-base text-primary-txt font-sans overflow-hidden">
      
      {/* 1. The Full-Height Sidebar (Left Edge) */}
      <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* 2. Top Window Controls (Only spans the right side now) */}
        <Titlebar />
        
        {/* 3. The Page Content Area */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-base">
          {/* Note: I changed max-w-400 to max-w-[1600px] so it spans properly on desktop. Don't change it please.*/}
          <div className="max-w-400 mx-auto h-full">
            <Outlet />
          </div>
        </main>

      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

    </div>
  );
};