import { Power } from 'lucide-react';

interface ActionBlockProps {
  actionTarget: string;
  actionType: string;
  isActive: boolean;
}

export const ActionBlock = ({ actionTarget, actionType, isActive }: ActionBlockProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center w-24 shrink-0 relative z-10">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 border backdrop-blur-md transition-all duration-500
        ${isActive ? 'bg-theme-accent/10 text-theme-accent border-theme-accent/50 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.2)]' : 'bg-surface-1 text-primary-txt border-surface-3'}
      `}>
        <Power size={20} />
      </div>
      <span className="text-[9px] font-mono text-secondary-txt uppercase tracking-widest line-clamp-1" title={actionTarget}>
        {actionTarget}
      </span>
      <span className="text-xs font-bold text-primary-txt mt-1 line-clamp-1" title={actionType}>
        {actionType}
      </span>
    </div>
  );
};
