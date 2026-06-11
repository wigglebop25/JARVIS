import { Database, Info } from 'lucide-react';
import { RagTelemetry } from '@/services/ragService';

interface RAGHeaderProps {
  vaultPath: string;
  stats: RagTelemetry | null;
  onSelectPath: () => void;
}

export const RAGHeader = ({ vaultPath, stats, onSelectPath }: RAGHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight text-white/90 flex items-center gap-3">
            <Database size={18} className="text-offline-core" />
            KNOWLEDGE_CORE
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="px-2 py-0.5 bg-offline-core/10 border border-offline-core/30 rounded text-[9px] font-mono text-offline-core tracking-widest flex items-center gap-1">
              <Info size={10} />
              AIR_GAPPED
            </div>
            <button
              onClick={onSelectPath}
              className="text-[10px] font-mono text-offline-core/60 hover:text-offline-core transition-colors truncate max-w-[200px] cursor-pointer"
              title="Click to change workspace"
            >
              {vaultPath || 'Select workspace...'}
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono text-secondary-txt/60">
        {stats && (
          <>
            <span>NOTES: {stats.totalNotes}</span>
            <span>CHUNKS: {stats.totalChunks}</span>
          </>
        )}
      </div>
    </div>
  );
};
