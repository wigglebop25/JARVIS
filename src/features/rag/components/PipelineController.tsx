import { Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface PipelineControllerProps {
  isSyncing: boolean;
  syncProgress: number;
  onStartIndexing: () => void;
  onClearDatabase: () => void;
  onRefresh: () => void;
}

export const PipelineController = ({ isSyncing, syncProgress, onStartIndexing, onClearDatabase, onRefresh }: PipelineControllerProps) => {
  return (
    <div className="bg-offline-surface-dark border border-offline-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-offline-core uppercase tracking-widest font-bold">
          Pipeline Control
        </span>
        <button onClick={onRefresh} className="p-1 hover:bg-white/10 rounded cursor-pointer" title="Refresh">
          <RefreshCw size={12} className="text-secondary-txt" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={onStartIndexing}
          disabled={isSyncing}
          className="w-full px-4 py-2 bg-offline-core/10 border border-offline-core/30 rounded-lg text-[11px] font-mono text-offline-core hover:bg-offline-core/20 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSyncing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={12} className="animate-spin" />
              Indexing... {syncProgress}%
            </span>
          ) : (
            'Start Indexing'
          )}
        </button>

        {isSyncing && (
          <div className="w-full h-1 bg-offline-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-offline-core"
              initial={{ width: 0 }}
              animate={{ width: `${syncProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <button
          onClick={onClearDatabase}
          disabled={isSyncing}
          className="w-full px-4 py-2 bg-red-950/20 border border-red-500/30 rounded-lg text-[11px] font-mono text-red-400 hover:bg-red-950/30 transition-colors disabled:opacity-50 cursor-pointer"
        >
          Clear Vector DB
        </button>
      </div>
    </div>
  );
};
