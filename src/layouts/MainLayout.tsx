import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Titlebar } from '@/components/navigation/Titlebar';
import { Sidebar } from '@/components/navigation/Sidebar'; 
import { Outlet } from 'react-router-dom'; 
import { SettingsModal } from '@/components/modals/SettingsModal';
import { OnlinePromptOverlay } from '@/features/chat'; 
import { useTheme } from '@/context/ThemeContext';
import { useVoice } from '@/context/VoiceContext';
import { VoiceStatusOrb } from '@/features/chat';

// ─── Floating Grid Particles Background ──────────────────────────────────────

const FloatingGridParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Dynamic nodes array
    const particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = [];
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    const getThemeColor = () => {
      if (theme === 'cyberpunk') return 'rgba(255, 0, 127, ';
      if (theme === 'amber') return 'rgba(255, 170, 0, ';
      return 'rgba(0, 240, 255, '; // default jarvis
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw static grid overlay
      ctx.strokeStyle = getThemeColor() + '0.015)';
      ctx.lineWidth = 1;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw and connect floating nodes
      const colorPrefix = getThemeColor();
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = colorPrefix + '0.15)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.08;
            ctx.strokeStyle = colorPrefix + `${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60" />;
};

// ─── Main Component ──────────────────────────────────────────────────────────

export const MainLayout = () => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { theme } = useTheme();
  const { status } = useVoice();

  return (
    <div className={`flex h-screen w-screen bg-theme-bg text-primary-txt font-sans overflow-hidden relative theme-${theme}`}>
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Dynamic Nodes Canvas */}
        <FloatingGridParticles />

        {/* Orbiting blobs using theme color variable */}
        <motion.div 
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-theme-accent opacity-15 blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, -70, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full bg-theme-accent opacity-10 blur-[100px]" 
        />
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-theme-accent opacity-5 blur-[120px]" 
        />
      </div>

      {/* --- SIDEBAR LAYER --- */}
      <aside className="z-30 relative h-full overflow-visible shrink-0">
        <Sidebar onSettingsClick={() => setIsSettingsOpen(true)} />
      </aside>
      
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden z-10 relative">
        <Titlebar />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
          <div className="max-w-[1600px] mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      <OnlinePromptOverlay />

      {/* --- COMPACT VOICE STATUS STRIP (replaces fullscreen overlay) --- */}
      <AnimatePresence>
        {status === 'LISTENING' && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="fixed top-[60px] left-0 right-0 z-[60] flex items-center justify-center pointer-events-none"
          >
            <div className="flex items-center gap-3 px-5 py-2 bg-theme-surface-1/90 border border-theme-accent/30 rounded-b-xl shadow-[0_4px_20px_rgba(var(--theme-accent-rgb),0.1)]">
              <div className="w-2 h-2 rounded-full bg-theme-accent shadow-[0_0_8px_var(--theme-accent)] animate-pulse" />
              <span className="text-[9px] font-mono text-theme-accent uppercase tracking-[0.25em] font-bold animate-pulse">
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
  );
};