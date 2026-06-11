import { FileText } from 'lucide-react';

interface DocumentExplorerProps {
  documents: { name: string; path: string }[];
  onSelect: (path: string) => void;
  selectedDocument: string | null;
}

export const DocumentExplorer = ({ documents, onSelect, selectedDocument }: DocumentExplorerProps) => {
  return (
    <div className="bg-offline-surface-dark border border-offline-border rounded-xl p-4 h-full flex flex-col">
      <div className="mb-3">
        <span className="text-[10px] font-mono text-offline-core uppercase tracking-widest font-bold">
          Documents
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {documents.map((doc) => (
          <button
            key={doc.path}
            onClick={() => onSelect(doc.path)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-mono text-[11px] cursor-pointer ${
              selectedDocument === doc.path
                ? 'bg-offline-core/10 text-offline-core'
                : 'text-secondary-txt hover:bg-offline-core/5 hover:text-offline-core'
            }`}
          >
            <FileText size={14} className="shrink-0" />
            <span className="truncate">{doc.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
