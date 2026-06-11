import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  content: string;
  lang?: string;
  themeColorClass: string;
}

export const CodeBlock = ({ content, lang, themeColorClass }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch {
      // Clipboard write failed silently (e.g., non-secure context)
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/40 my-3.5 font-mono">
      <div className="px-4 py-1.5 bg-white/5 border-b border-white/5 flex justify-between items-center text-[10px] text-secondary-txt/60 uppercase tracking-wider select-none">
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors text-[9px] flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check size={10} className={themeColorClass} />
              <span className={themeColorClass}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className={`p-4 overflow-x-auto text-[12px] leading-relaxed whitespace-pre ${themeColorClass}`}>
        <code>{content}</code>
      </pre>
    </div>
  );
};
