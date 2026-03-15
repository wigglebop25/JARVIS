// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { DeviceManagementPage } from '@/pages/DeviceManagementPage';
import { AutomationPage } from '@/pages/AutomationPage';
import './styles.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/device" element={<DeviceManagementPage />} />
          <Route path='/automations' element={<AutomationPage/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;