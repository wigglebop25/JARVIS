import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { AttachedFile } from '../hooks/useFileAttachments';

interface AttachedFileChipsProps {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}

export const AttachedFileChips = ({ files, onRemove }: AttachedFileChipsProps) => {
  return (
    <AnimatePresence>
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2 pb-3 mb-2 border-b border-white/5"
        >
          {files.map(file => (
            <motion.div
              key={file.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-secondary-txt text-xs font-mono select-none backdrop-blur-md transition-all hover:bg-white/10"
              title={file.path}
            >
              <FileText size={12} className="opacity-75" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => onRemove(file.id)}
                className="p-0.5 rounded hover:bg-white/10 text-tertiary-txt hover:text-white transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
