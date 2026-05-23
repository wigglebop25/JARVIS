import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'code' | 'ul' | 'ol' | 'blockquote' | 'hr';
  content: string;
  items?: string[];
  lang?: string;
}

interface Token {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
  content: string;
  url?: string;
}

// ─── Inline Token Parser ───────────────────────────────────────────────────

const parseInline = (text: string): Token[] => {
  let tokens: Token[] = [{ type: 'text', content: text }];

  // 1. Fenced inline code
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return [token];
    const parts = token.content.split('`');
    return parts.map((part, i) => {
      const isCode = i % 2 === 1;
      return {
        type: isCode ? 'code' as const : 'text' as const,
        content: part
      };
    });
  });

  // 2. Links: [label](url)
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return [token];
    const result: Token[] = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(token.content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        result.push({
          type: 'text',
          content: token.content.substring(lastIndex, matchIndex)
        });
      }
      result.push({
        type: 'link',
        content: match[1],
        url: match[2]
      });
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < token.content.length) {
      result.push({
        type: 'text',
        content: token.content.substring(lastIndex)
      });
    }

    return result.length > 0 ? result : [token];
  });

  // 3. Bold: **text**
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return [token];
    const parts = token.content.split('**');
    return parts.map((part, i) => {
      const isBold = i % 2 === 1;
      return {
        type: isBold ? 'bold' as const : 'text' as const,
        content: part
      };
    });
  });

  // 4. Italic: *text*
  tokens = tokens.flatMap(token => {
    if (token.type !== 'text') return [token];
    const parts = token.content.split('*');
    return parts.map((part, i) => {
      const isItalic = i % 2 === 1;
      return {
        type: isItalic ? 'italic' as const : 'text' as const,
        content: part
      };
    });
  });

  return tokens;
};

// ─── Inline Content Renderer ───────────────────────────────────────────────

const RenderInline = ({ text, themeColorClass }: { text: string; themeColorClass: string }) => {
  const tokens = parseInline(text);

  return (
    <>
      {tokens.map((token, i) => {
        switch (token.type) {
          case 'code':
            return (
              <code key={i} className={`bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono text-[12px] ${themeColorClass}`}>
                {token.content}
              </code>
            );
          case 'bold':
            return (
              <strong key={i} className="font-extrabold text-white">
                {token.content}
              </strong>
            );
          case 'italic':
            return (
              <em key={i} className="italic text-white/90">
                {token.content}
              </em>
            );
          case 'link':
            return (
              <a
                key={i}
                href={token.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:text-white transition-colors ${themeColorClass}`}
              >
                {token.content}
              </a>
            );
          case 'text':
          default:
            return token.content;
        }
      })}
    </>
  );
};

// ─── Code Block Renderer with Copy Action ──────────────────────────────────

const CodeBlock = ({ content, lang, themeColorClass }: { content: string; lang?: string; themeColorClass: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
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

// ─── Main Parser & Renderer ───────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string;
  theme?: 'online' | 'offline';
}

export const MarkdownRenderer = ({ content, theme = 'offline' }: MarkdownRendererProps) => {
  if (!content) return null;

  const themeColorClass = theme === 'offline' ? 'text-offline-core' : 'text-jarvis-blue';

  // Parse lines into blocks
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        blocks.push({
          type: 'code',
          content: codeContent.join('\n'),
          lang: codeLang
        });
        codeContent = [];
        codeLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.trim().substring(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    const trimmed = line.trim();

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      blocks.push({ type: 'hr', content: '' });
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', content: line.substring(2) });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.substring(3) });
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push({ type: 'h3', content: line.substring(4) });
      continue;
    }
    if (line.startsWith('#### ')) {
      blocks.push({ type: 'h4', content: line.substring(5) });
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push({ type: 'blockquote', content: line.substring(2) });
      continue;
    }

    const ulMatch = line.match(/^(\s*)([-*•])\s+(.*)/);
    if (ulMatch) {
      const itemContent = ulMatch[3];
      const prevBlock = blocks[blocks.length - 1];
      if (prevBlock && prevBlock.type === 'ul' && prevBlock.items) {
        prevBlock.items.push(itemContent);
      } else {
        blocks.push({ type: 'ul', content: '', items: [itemContent] });
      }
      continue;
    }

    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/);
    if (olMatch) {
      const itemContent = olMatch[3];
      const prevBlock = blocks[blocks.length - 1];
      if (prevBlock && prevBlock.type === 'ol' && prevBlock.items) {
        prevBlock.items.push(itemContent);
      } else {
        blocks.push({ type: 'ol', content: '', items: [itemContent] });
      }
      continue;
    }

    if (trimmed === '') {
      continue;
    }

    const prevBlock = blocks[blocks.length - 1];
    if (prevBlock && prevBlock.type === 'paragraph') {
      prevBlock.content += '\n' + line;
    } else {
      blocks.push({ type: 'paragraph', content: line });
    }
  }

  if (inCodeBlock) {
    blocks.push({
      type: 'code',
      content: codeContent.join('\n'),
      lang: codeLang
    });
  }

  // Render blocks to React elements
  return (
    <div className="space-y-2">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <h1 key={idx} className="text-xl font-bold font-mono tracking-tight text-white mb-2 mt-4 first:mt-0">
                <RenderInline text={block.content} themeColorClass={themeColorClass} />
              </h1>
            );
          case 'h2':
            return (
              <h2 key={idx} className="text-lg font-bold font-mono tracking-tight text-white mb-2 mt-3 first:mt-0">
                <RenderInline text={block.content} themeColorClass={themeColorClass} />
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className="text-md font-bold font-mono tracking-tight text-white mb-1 mt-2.5 first:mt-0">
                <RenderInline text={block.content} themeColorClass={themeColorClass} />
              </h3>
            );
          case 'h4':
            return (
              <h4 key={idx} className="text-sm font-semibold font-mono tracking-tight text-white mb-1 mt-2 first:mt-0">
                <RenderInline text={block.content} themeColorClass={themeColorClass} />
              </h4>
            );
          case 'blockquote':
            return (
              <blockquote key={idx} className="border-l-4 border-white/20 pl-3.5 italic text-secondary-txt/80 my-2 leading-relaxed">
                <RenderInline text={block.content} themeColorClass={themeColorClass} />
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-5 my-2 space-y-1">
                {block.items?.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    <RenderInline text={item} themeColorClass={themeColorClass} />
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-5 my-2 space-y-1">
                {block.items?.map((item, i) => (
                  <li key={i} className="leading-relaxed">
                    <RenderInline text={item} themeColorClass={themeColorClass} />
                  </li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <CodeBlock
                key={idx}
                content={block.content}
                lang={block.lang}
                themeColorClass={themeColorClass}
              />
            );
          case 'hr':
            return <hr key={idx} className="border-t border-white/10 my-4" />;
          case 'paragraph':
          default:
            return (
              <p key={idx} className="leading-relaxed whitespace-pre-wrap">
                <RenderInline text={block.content} themeColorClass={themeColorClass} />
              </p>
            );
        }
      })}
    </div>
  );
};
