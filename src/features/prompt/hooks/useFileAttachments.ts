import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

export interface AttachedFile {
  id: string;
  path: string;
  name: string;
}

interface UseFileAttachmentsReturn {
  files: AttachedFile[];
  add: () => Promise<void>;
  remove: (id: string) => void;
  clear: () => void;
}

export const useFileAttachments = (): UseFileAttachmentsReturn => {
  const [files, setFiles] = useState<AttachedFile[]>([]);

  const add = useCallback(async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Documents',
          extensions: ['txt', 'md', 'pdf']
        }]
      });

      if (!selected) return;

      const paths = Array.isArray(selected) ? selected : [selected];
      const newFiles: AttachedFile[] = [];

      setFiles(prev => {
        const currentPaths = new Set(prev.map(f => f.path));
        for (const selectedPath of paths) {
          if (currentPaths.has(selectedPath)) continue;
          currentPaths.add(selectedPath);
          const fileName = selectedPath.split(/[/\\]/).pop() || selectedPath;
          newFiles.push({
            id: `${selectedPath}-${Date.now()}-${Math.random()}`,
            path: selectedPath,
            name: fileName,
          });
        }
        return [...prev, ...newFiles];
      });
    } catch (err) {
      console.error("Failed to select file:", err);
    }
  }, []);

  const remove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const clear = useCallback(() => {
    setFiles([]);
  }, []);

  return { files, add, remove, clear };
};
