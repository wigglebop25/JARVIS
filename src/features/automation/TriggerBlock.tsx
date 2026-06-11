import { getTriggerIcon } from './utils/getTriggerIcon';

interface TriggerBlockProps {
  triggerType: string;
  triggerValue: string;
}

export const TriggerBlock = ({ triggerType, triggerValue }: TriggerBlockProps) => {
  const colorClass = triggerType === 'time'
    ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/30 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.1)]'
    : triggerType === 'device'
      ? 'bg-error-red/10 text-error-red border-error-red/30 shadow-[0_0_15px_rgba(255,51,51,0.1)]'
      : 'bg-success-green/10 text-success-green border-success-green/30 shadow-[0_0_15px_rgba(0,255,102,0.1)]';

  return (
    <div className="flex flex-col items-center justify-center text-center w-24 shrink-0 relative z-10">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 border backdrop-blur-md transition-all duration-500 ${colorClass}`}>
        {getTriggerIcon(triggerType)}
      </div>
      <span className="text-[9px] font-mono text-secondary-txt uppercase tracking-widest">{triggerType}</span>
      <span className="text-xs font-bold text-primary-txt mt-1 line-clamp-1" title={triggerValue}>
        {triggerValue}
      </span>
    </div>
  );
};
