import { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

interface PipelineConsoleProps {
  logs: string[];
}

export const PipelineConsole = ({ logs }: PipelineConsoleProps) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/60 border border-offline-border/50 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-offline-border/30">
        <Terminal size={12} className="text-offline-core" />
        <span className="text-[9px] font-mono text-offline-core uppercase tracking-widest font-bold">Console</span>
      </div>
      <div
        ref={consoleRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 font-mono text-[10px] text-offline-core/70"
      >
        {logs.map((log, i) => (
          <div key={i} className="leading-relaxed">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
