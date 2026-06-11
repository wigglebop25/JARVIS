import { Folder, ChevronLeft } from 'lucide-react';

interface FolderBrowserProps {
  folders: string[];
  selectedFolder: string | null;
  onSelect: (folder: string) => void;
  onBack: () => void;
}

export const FolderBrowser = ({ folders, selectedFolder, onSelect, onBack }: FolderBrowserProps) => {
  return (
    <div className="bg-offline-surface-dark border border-offline-border rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {selectedFolder && (
          <button onClick={onBack} className="p-1 hover:bg-white/5 rounded cursor-pointer">
            <ChevronLeft size={14} className="text-offline-core" />
          </button>
        )}
        <span className="text-[10px] font-mono text-offline-core uppercase tracking-widest font-bold">
          {selectedFolder ? selectedFolder : 'Workspace Folders'}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {folders.map((folder) => (
          <button
            key={folder}
            onClick={() => onSelect(folder)}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-offline-core/5 text-secondary-txt hover:text-offline-core transition-colors font-mono text-[11px] cursor-pointer"
          >
            <Folder size={14} className="shrink-0" />
            <span className="truncate">{folder}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
