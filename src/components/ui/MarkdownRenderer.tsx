import { useState, useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';

// Initialize Mermaid once
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#22c55e',
      primaryTextColor: '#fff',
      primaryBorderColor: '#22c55e',
      lineColor: '#22c55e',
      secondaryColor: '#1e293b',
      tertiaryColor: '#0f172a'
    }
  });
} catch (e) {
  console.error('Failed to initialize mermaid', e);
}

// Cache for rendered Mermaid SVGs to prevent flicker on remount / scroll
const mermaidCache = new Map<string, string>();

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

// ─── Mermaid Diagrams Renderer ─────────────────────────────────────────────
const MermaidBlock = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanChart = chart.trim();
  const [svg, setSvg] = useState<string>(() => mermaidCache.get(cleanChart) || '');

  useEffect(() => {
    const cached = mermaidCache.get(cleanChart);
    if (cached) {
      setSvg(cached);
      setError(null);
      return;
    }

    // Reset svg state to empty if not cached, so we don't show the previous diagram
    setSvg('');
    setError(null);

    let active = true;
    const renderChart = async () => {
      if (!containerRef.current) return;
      if (!cleanChart) return;
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);
        
        if (active) {
          mermaidCache.set(cleanChart, renderedSvg);
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (active) {
          const errorMsg = err?.message || String(err);
          setError(errorMsg.split('\n')[0] || 'Diagram syntax error');
        }
      }
    };

    renderChart();

    return () => {
      active = false;
    };
  }, [cleanChart]);

  if (error) {
    return (
      <div className="my-3.5 border border-red-500/20 rounded-lg overflow-hidden bg-red-950/10 font-mono">
        <div className="px-4 py-1.5 bg-red-950/20 border-b border-red-500/20 text-[10px] text-red-400 uppercase tracking-wider select-none">
          Mermaid Render Error
        </div>
        <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed text-red-400/90 whitespace-pre">
          <code>{error}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/40 my-3.5 p-4 flex justify-center items-center">
      <div className="absolute top-2 right-2 text-[8px] font-mono text-secondary-txt/30 uppercase tracking-widest pointer-events-none select-none">
        Diagram_Canvas
      </div>
      <div 
        ref={containerRef}
        className="w-full flex justify-center overflow-x-auto custom-scrollbar select-none"
        dangerouslySetInnerHTML={{ __html: svg || '<div class="text-[11px] text-secondary-txt/40 font-mono animate-pulse">RENDERING_DIAGRAM...</div>' }}
      />
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
interface MarkdownRendererProps {
  content: string;
  theme?: 'online' | 'offline';
}

export const MarkdownRenderer = ({ content, theme = 'offline' }: MarkdownRendererProps) => {
  if (!content) return null;

  const themeColorClass = theme === 'offline' ? 'text-offline-core' : 'text-theme-accent';

  // Pre-process LaTeX delimiters: replace \[ ... \] with $$ ... $$ and \( ... \) with $ ... $
  let processed = content;
  processed = processed.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$\n$1\n$$');
  processed = processed.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$1$');

  // ─── Custom react-markdown element components ───
  const components = {
    // Code blocks & Mermaid diagrams
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      const textContent = String(children).replace(/\n$/, '');

      // Check if code block is inline (no class)
      const isInline = !className;

      if (!isInline && lang === 'mermaid') {
        return <MermaidBlock chart={textContent} />;
      }

      if (!isInline) {
        return (
          <CodeBlock
            content={textContent}
            lang={lang}
            themeColorClass={themeColorClass}
          />
        );
      }

      return (
        <code className={`bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono text-[12px] ${themeColorClass}`} {...props}>
          {children}
        </code>
      );
    },

    // Headers
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold font-mono tracking-tight text-white mb-2 mt-4 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-bold font-mono tracking-tight text-white mb-2 mt-3 first:mt-0">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-md font-bold font-mono tracking-tight text-white mb-1 mt-2.5 first:mt-0">
        {children}
      </h3>
    ),
    h4: ({ children }: any) => (
      <h4 className="text-sm font-semibold font-mono tracking-tight text-white mb-1 mt-2 first:mt-0">
        {children}
      </h4>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-white/20 pl-3.5 italic text-secondary-txt/80 my-2 leading-relaxed">
        {children}
      </blockquote>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc pl-5 my-2 space-y-1">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal pl-5 my-2 space-y-1">
        {children}
      </ol>
    ),
    input: ({ type, checked, ...props }: any) => {
      if (type === 'checkbox') {
        return (
          <input
            type="checkbox"
            checked={checked}
            readOnly
            className={`mt-1 mr-2 shrink-0 ${
              theme === 'offline' ? 'accent-offline-core' : 'accent-theme-accent'
            }`}
            {...props}
          />
        );
      }
      return <input type={type} checked={checked} {...props} />;
    },

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 border border-white/10 rounded-lg bg-black/20 shadow-lg max-w-full">
        <table className="w-full border-collapse text-left">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="border-b border-white/10 bg-white/5 font-mono text-[10px] tracking-wider uppercase">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="divide-y divide-white/5 font-sans text-xs">
        {children}
      </tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className={`px-4 py-2 font-bold ${themeColorClass}`}>
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-secondary-txt/90">
        {children}
      </td>
    ),

    // Horizontal Rule
    hr: () => <hr className="border-t border-white/10 my-4" />,

    // Links
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:text-white transition-colors ${themeColorClass}`}
        {...props}
      >
        {children}
      </a>
    ),

    // Paragraph
    p: ({ children }: any) => (
      <p className="leading-relaxed whitespace-pre-wrap mb-2">
        {children}
      </p>
    ),

    // Custom HTML Details block rendering via rehype-raw
    details: ({ children }: any) => (
      <details className="my-3 border border-white/10 rounded-lg bg-black/20 overflow-hidden">
        {children}
      </details>
    ),
    summary: ({ children }: any) => (
      <summary className="px-4 py-2 bg-white/5 font-mono text-[10px] font-bold text-primary-txt/90 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none outline-none">
        {children}
      </summary>
    )
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      components={components}
    >
      {processed}
    </ReactMarkdown>
  );
};
