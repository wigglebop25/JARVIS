import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

// We extend HTMLMotionProps so we can pass Framer Motion props AND standard button props
interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = "",
  children,
  ...props
}: ButtonProps) => {
  
  // 1. Base styles every button shares
  const baseStyles = "font-mono rounded-md flex items-center justify-center transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide";

  // 2. Size dictionary
  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-3"
  };

  // 3. Variant dictionary using your exact JARVIS tokens
  const variants = {
    primary: "bg-jarvis-blue/10 text-jarvis-blue border border-jarvis-blue/50 hover:bg-jarvis-blue hover:text-base hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]",
    outline: "bg-transparent text-secondary-txt border border-surface-3 hover:border-jarvis-blue hover:text-jarvis-blue",
    ghost: "bg-transparent text-secondary-txt border border-transparent hover:bg-surface-2 hover:text-primary-txt",
    danger: "bg-error-red/10 text-error-red border border-error-red/50 hover:bg-error-red hover:text-white hover:shadow-[0_0_15px_rgba(255,51,51,0.4)]"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }} // The physical "click" feel
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};