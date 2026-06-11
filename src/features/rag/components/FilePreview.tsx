import { X } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

interface FilePreviewProps {
  content: string;
  fileName: string;
  onClose: () => void;
}

export const FilePreview = ({ content, fileName, onClose }: FilePreviewProps) => {
  return (
    <div className="bg-offline-surface-dark/60 backdrop-blur-md border border-offline-border rounded-xl overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-offline-border/30">
        <span className="text-[10px] font-mono text-offline-core truncate">{fileName}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded cursor-pointer">
          <X size={12} className="text-secondary-txt" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <MarkdownRenderer content={content} theme="offline" />
      </div>
    </div>
  );
};
