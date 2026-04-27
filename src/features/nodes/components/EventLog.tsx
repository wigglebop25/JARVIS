import { Card } from '@/components/ui/Card';

interface Event {
  id: string;
  time: string;
  title: string;
}

interface EventLogProps {
  events: Event[];
}

export const EventLog = ({ events }: EventLogProps) => {
  return (
    <Card title="EVENT_LOG" cornerAccents={true} className="h-full">
      <div className="flex flex-col gap-4 mt-2 overflow-y-auto custom-scrollbar pr-2 h-full">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4 items-start border-l border-white/10 pl-3 relative group hover:border-jarvis-blue transition-colors">
            <div className="absolute -left-1.25 top-1 w-2 h-2 rounded-full bg-white/20 group-hover:bg-jarvis-blue transition-colors" />
            <span className="text-[10px] text-jarvis-blue font-mono mt-0.5 shrink-0 w-10">{event.time}</span>
            <p className="text-xs text-primary-txt font-bold uppercase tracking-tight">{event.title}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};