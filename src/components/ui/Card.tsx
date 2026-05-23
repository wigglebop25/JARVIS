import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  glow?: boolean;
  cornerAccents?: boolean;
  techBg?: boolean;
  glass?: boolean; 
}

export const Card = ({ 
  children, 
  title, 
  className = "", 
  glow = false, 
  cornerAccents = true, 
  techBg = false,
  glass = true, 
  ...props 
}: CardProps) => {
  return (
    <div
      className={`relative flex flex-col rounded-lg transition-all duration-300
        ${glass 
          ? 'bg-surface-1/40 backdrop-blur-md border border-white/5 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]' 
          : 'bg-surface-1 border border-surface-3'
        }
        ${glow ? 'shadow-[0_0_15px_rgba(0,240,255,0.05)] border-jarvis-blue/30' : ''}
        ${className}
      `}
      {...props}
    >
      {/* 1. Optional Tech Grid Background */}
      {techBg && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[16px_16px] pointer-events-none rounded-lg" />
      )}

      {/* 2. HUD Corner Accents */}
      {cornerAccents && (
        <>
          <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-jarvis-blue/50 rounded-tl-lg pointer-events-none z-10" />
          <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-jarvis-blue/50 rounded-br-lg pointer-events-none z-10" />
        </>
      )}

      {/* 3. Optional Title Bar with Glowing Status Dot */}
      {title && (
        <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-sm ${glow ? 'bg-jarvis-blue shadow-[0_0_8px_#00F0FF]' : 'bg-surface-3'}`} />
            <div>
              <h3 className="text-primary-txt font-sans text-xs font-semibold tracking-wider uppercase">
                {title}
              </h3>
            </div>
          </div>
          
          {/* Decorative Tech Dots */}
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-surface-3"></div>
            <div className="w-1 h-1 rounded-full bg-surface-3"></div>
          </div>
        </div>
      )}
      
      {/* 4. Content Area */}
      <div className="flex-1 p-5 relative z-10 text-secondary-txt flex flex-col">
        {children}
      </div>
    </div>
  );
};