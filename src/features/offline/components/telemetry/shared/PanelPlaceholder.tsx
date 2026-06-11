import { motion } from 'framer-motion';

interface PanelPlaceholderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onAction?: () => void;
}

export const PanelPlaceholder = ({ icon, title, description, buttonText, onAction }: PanelPlaceholderProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center h-full text-center p-6"
  >
    <div className="text-offline-core/30 mb-3">{icon}</div>
    <span className="text-[10px] font-mono text-secondary-txt/40 uppercase tracking-widest">{title}</span>
    <p className="text-[11px] font-mono text-secondary-txt/30 mt-1 max-w-[160px]">{description}</p>
    {buttonText && onAction && (
      <button
        onClick={onAction}
        className="mt-4 px-4 py-1.5 border border-offline-border rounded text-[10px] font-mono text-offline-core/60 hover:bg-offline-core/5 transition-colors cursor-pointer"
      >
        {buttonText}
      </button>
    )}
  </motion.div>
);
