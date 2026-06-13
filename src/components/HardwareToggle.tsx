import { motion } from 'framer-motion';

export const HardwareToggle = ({ label, enabled, onToggle, iconOn, iconOff, disabled }: {
  label: string; enabled: boolean; onToggle: () => void;
  iconOn: React.ReactNode; iconOff: React.ReactNode; disabled?: boolean;
}) => (
  <button
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    aria-disabled={disabled}
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border transition-all duration-300 group
      ${disabled
        ? 'opacity-[0.4] cursor-not-allowed'
        : enabled
          ? 'bg-offline-core/5 border-offline-core/30 hover:bg-offline-core/10'
          : 'bg-white/[0.02] border-white/5 hover:border-white/15 opacity-50 hover:opacity-70'
      }`}
  >
    <div className={`transition-colors ${enabled ? 'text-offline-core' : 'text-secondary-txt/50'}`}>
      {enabled ? iconOn : iconOff}
    </div>
    <span className={`text-xs font-mono uppercase tracking-wider flex-1 text-left transition-colors
      ${enabled ? 'text-offline-core' : 'text-secondary-txt/55'}`}>
      {label}
    </span>
    <div className={`w-7 h-3.5 rounded-full relative transition-colors duration-300 border
      ${enabled ? 'bg-offline-core/20 border-offline-core/50' : 'bg-white/5 border-white/10'}`}>
      <motion.div
        animate={{ x: enabled ? 14 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`w-2.5 h-2.5 rounded-full absolute top-[1px] transition-colors duration-300
          ${enabled ? 'bg-offline-core shadow-[0_0_6px_var(--color-offline-core)]' : 'bg-secondary-txt/40'}`}
      />
    </div>
  </button>
);
