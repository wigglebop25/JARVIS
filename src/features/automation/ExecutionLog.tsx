import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ExecutionLogProps {
  logs: string[];
  isExecuting: boolean;
}

export const ExecutionLog = ({ logs, isExecuting }: ExecutionLogProps) => {
  if (!logs && !isExecuting) return null;

  return (
    <div className="flex-1 flex flex-col font-mono text-[10px] text-theme-accent bg-black/60 p-4 rounded-lg border border-theme-accent/30 mb-6 h-28 overflow-y-auto relative custom-scrollbar">
      <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[8px] uppercase tracking-wider text-theme-accent/60">
        {isExecuting ? (
          <>
            <Loader2 size={8} className="animate-spin" />
            Executing
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-success-green" />
            Completed
          </>
        )}
      </div>
      <div className="space-y-1 select-none pr-12">
        {logs?.map((log, i) => (
          <div key={i} className="leading-relaxed break-all">
            {log}
          </div>
        ))}
        {isExecuting && (
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block w-1.5 h-3 bg-theme-accent ml-0.5"
          />
        )}
      </div>
    </div>
  );
};
