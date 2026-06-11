import React from 'react';

interface ProtocolButtonProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  activeColor: string;
}

export const ProtocolButton = ({ title, desc, icon, onClick, activeColor }: ProtocolButtonProps) => (
  <button 
    onClick={onClick}
    style={{ '--hover-accent': activeColor } as React.CSSProperties}
    className="w-72 p-10 border border-white/5 hover:border-[var(--hover-accent)] bg-white/[0.01] hover:bg-[var(--hover-accent)]/[0.02] transition-all duration-500 group flex flex-col items-center gap-6 text-center relative overflow-hidden"
  >
    {/* Corner accents for that industrial look */}
    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10 group-hover:border-[var(--hover-accent)] transition-colors" />
    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10 group-hover:border-[var(--hover-accent)] transition-colors" />

    <div className="text-white/20 group-hover:text-[var(--hover-accent)] transition-all duration-500 transform group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_var(--hover-accent)]">
      {icon}
    </div>
    
    <div className="space-y-2">
      <h3 className="font-mono text-sm text-white/40 group-hover:text-white uppercase tracking-[0.2em] transition-colors">
        {title}
      </h3>
      <p className="font-mono text-[9px] text-white/20 group-hover:text-white/40 tracking-wider">
        {desc}
      </p>
    </div>

    {/* Subtle progress bar at bottom of button */}
    <div className="absolute bottom-0 left-0 h-[1px] bg-[var(--hover-accent)] w-0 group-hover:w-full transition-all duration-700" />
  </button>
);
