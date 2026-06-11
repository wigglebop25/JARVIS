import { MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/utils/time';
import { Session } from '@/types/tauri';

interface RecentSessionCardProps {
  session: Session;
  onSelect: (id: string) => void;
}

export const RecentSessionCard = ({ session, onSelect }: RecentSessionCardProps) => {
  const title = session.title || 'Untitled Session';
  const displayTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;

  return (
    <button
      onClick={() => onSelect(session.id)}
      className="flex flex-col text-left p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-offline-core/5 hover:border-offline-core/20 hover:shadow-[0_0_15px_rgba(244,244,245,0.02)] transition-all duration-300 group cursor-pointer outline-none"
    >
      <div className="flex items-center gap-2 mb-1.5 text-secondary-txt/30 group-hover:text-offline-core/60 transition-colors">
        <MessageSquare size={11} />
        <span className="text-[8px] font-mono uppercase tracking-wider font-bold">
          {formatRelativeTime(session.updated_at)}
        </span>
      </div>
      <span className="text-[11px] font-mono text-secondary-txt/80 group-hover:text-white truncate">
        {displayTitle}
      </span>
    </button>
  );
};
