import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';
import { OfflineMainLayout } from '@/layouts/OfflineMainLayout';

// Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { OfflineDashboardPage } from '@/pages/OfflineDashboardPage';
import { DeviceManagementPage } from '@/pages/DeviceManagementPage';
import { AutomationPage } from '@/pages/AutomationPage';
import { ModeSelectionPage } from '@/pages/ModeSelectionPage';
import { OfflineRAGPage } from '@/pages/OfflineRAGPage';

// Components
import { IntroBootSequence } from '@/components/ui/IntroBootSequence';
import { ModeSwitchTransition } from '@/components/ui/ModeSwitchTransition';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import './styles.css';

function App() {
  const [bootState, setBootState] = useState<'intro' | 'selection' | 'online' | 'offline'>(() => {
    const saved = sessionStorage.getItem('jarvis_mode');
    if (saved === 'online' || saved === 'offline') return saved as 'online' | 'offline';
    return 'intro';
  });

  const [transitionTarget, setTransitionTarget] = useState<'online' | 'offline' | 'selection' | null>(null);

  const handleModeSelect = (mode: 'online' | 'offline') => {
    setTransitionTarget(mode);
  };

  const handleTransitionComplete = () => {
    if (transitionTarget === 'online' || transitionTarget === 'offline') {
      sessionStorage.setItem('jarvis_mode', transitionTarget);
      setBootState(transitionTarget);
    } else if (transitionTarget === 'selection') {
      setBootState('selection');
    }
    setTransitionTarget(null);
  };

  useEffect(() => {
    // Returns user to the Protocol Selection screen (Triggered by Offline Sidebar)
    const handleSelection = () => {
      setTransitionTarget('selection');
    };

    // Performs a full system reset back to the Video Intro
    const handleRestart = () => {
      sessionStorage.removeItem('jarvis_mode');
      setBootState('intro');
    };

    window.addEventListener('go-to-selection', handleSelection);
    window.addEventListener('restart-jarvis', handleRestart);

    return () => {
      window.removeEventListener('go-to-selection', handleSelection);
      window.removeEventListener('restart-jarvis', handleRestart);
    };
  }, []);

  return (
    <div className="bg-black min-h-screen w-full overflow-hidden relative selection:bg-theme-accent/30">
      <AnimatePresence mode="wait">
        
        {/* PHASE 1: THE CINEMATIC INTRO */}
        {bootState === 'intro' && (
          <IntroBootSequence 
            key="intro" 
            onComplete={() => setBootState('selection')} 
          />
        )}

        {/* PHASE 2: PROTOCOL SELECTION (Local vs Sync) */}
        {bootState === 'selection' && (
          <ModeSelectionPage 
            key="selection" 
            onSelect={handleModeSelect} 
          />
        )}

        {/* PHASE 3: CORE APPLICATION LOAD */}
        {(bootState === 'online' || bootState === 'offline') && (
          <motion.div
            key="app-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full w-full"
          >
            <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                {/* --- OFFLINE BRANCH --- */}
                {bootState === 'offline' ? (
                  <Route element={<OfflineMainLayout />}>
                    <Route path="/" element={<OfflineDashboardPage />} />
                    <Route path="/rag" element={<OfflineRAGPage />} />
                    {/* Catch-all for offline: redirect any stray routes to terminal */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                ) : (
                  /* --- ONLINE BRANCH --- */
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/device" element={<DeviceManagementPage />} />
                    <Route path="/automations" element={<AutomationPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                )}
              </Routes>
            </BrowserRouter>
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Transition Overlay */}
      <AnimatePresence>
        {transitionTarget && (
          <ModeSwitchTransition 
            key="mode-switch-transition"
            target={transitionTarget} 
            onComplete={handleTransitionComplete} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;