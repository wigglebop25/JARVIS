import { Shield } from 'lucide-react';

export const RAGFooter = () => (
  <div className="flex items-center justify-between mt-4 pt-3 border-t border-offline-border/30 text-[9px] font-mono text-secondary-txt/40 uppercase tracking-[0.2em] select-none">
    <div className="flex items-center gap-2">
      <Shield size={10} className="text-offline-core/50" />
      <span>Air-Gapped_Node // Local_Index_Only</span>
    </div>
    <span>KNOWLEDGE_CORE v1.0</span>
  </div>
);
