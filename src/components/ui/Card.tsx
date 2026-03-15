import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  glow?: boolean; // Optional tech hover effect
}

export const Card = ({
    children,
    title,
    className="",
    glow = false,
    ...props
}: CardProps) => {
    return (
        <div
        className={`bg-surface-1 rounded-lg border border-surface-3 p-5 flex flex-col relative overflow-hidden
            ${glow ? 'hover:border-jarvis-blue/40 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] transition-all duration-300' : ''}
            ${className}
        `}
        {...props}
        >
            {/* Optional Title Bar */}
            {title && (
                <div className="mb-4 pb-2 border-b border-surface-3 flex items-center justify-between">
                <h3 className="text-jarvis-blue font-mono text-xs uppercase tracking-widest font-bold">
                    {title}
                </h3>
                {/* Decorative tech dots */}
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-surface-3"></div>
                    <div className="w-1 h-1 rounded-full bg-surface-3"></div>
                </div>
                </div>
            )}
            
            {/* Card Content */}
            <div className="flex-1 text-secondary-txt">
                {children}
            </div>
        </div>
    )
}