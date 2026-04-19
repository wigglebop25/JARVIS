import { Sidebar } from '@/components/Sidebar'; // Your normal one
import { OfflineSidebar } from '@/components/OfflineSidebar';
import { Titlebar } from '@/components/Titlebar';
import { Outlet } from 'react-router-dom';

export const OfflineMainLayout = () => {
  return (
    <div className="flex h-screen w-screen bg-offline-bg text-primary-txt font-sans overflow-hidden">
      {/* 1. Only show the Restricted Sidebar */}
      <OfflineSidebar />
      
      <div className="flex flex-col flex-1 relative">
        {/* 2. Same Titlebar for consistency */}
        <Titlebar />
        
        <main className="flex-1 relative overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};