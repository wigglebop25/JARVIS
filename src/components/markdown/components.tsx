import React from 'react';
import { MermaidBlock } from './MermaidBlock';
import { CodeBlock } from './CodeBlock';

// Hoisted static renderers (theme-independent, stable identity)
const H1 = ({ children }: React.ComponentProps<'h1'>) => (
  <h1 className="text-xl font-bold font-mono tracking-tight text-white mb-2 mt-4 first:mt-0">{children}</h1>
);
const H2 = ({ children }: React.ComponentProps<'h2'>) => (
  <h2 className="text-lg font-bold font-mono tracking-tight text-white mb-2 mt-3 first:mt-0">{children}</h2>
);
const H3 = ({ children }: React.ComponentProps<'h3'>) => (
  <h3 className="text-md font-bold font-mono tracking-tight text-white mb-1 mt-2.5 first:mt-0">{children}</h3>
);
const H4 = ({ children }: React.ComponentProps<'h4'>) => (
  <h4 className="text-sm font-semibold font-mono tracking-tight text-white mb-1 mt-2 first:mt-0">{children}</h4>
);
const Blockquote = ({ children }: React.ComponentProps<'blockquote'>) => (
  <blockquote className="border-l-4 border-white/20 pl-3.5 italic text-secondary-txt/80 my-2 leading-relaxed">{children}</blockquote>
);
const Ul = ({ children }: React.ComponentProps<'ul'>) => (
  <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
);
const Ol = ({ children }: React.ComponentProps<'ol'>) => (
  <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
);
const Hr = () => <hr className="border-t border-white/10 my-4" />;
const P = ({ children }: React.ComponentProps<'p'>) => (
  <p className="leading-relaxed whitespace-pre-wrap mb-2">{children}</p>
);

const Table = ({ children }: React.ComponentProps<'table'>) => (
  <div className="overflow-x-auto my-4 border border-white/10 rounded-lg bg-black/20 shadow-lg max-w-full">
    <table className="w-full border-collapse text-left">{children}</table>
  </div>
);
const Thead = ({ children }: React.ComponentProps<'thead'>) => (
  <thead className="border-b border-white/10 bg-white/5 font-mono text-[10px] tracking-wider uppercase">{children}</thead>
);
const Tbody = ({ children }: React.ComponentProps<'tbody'>) => (
  <tbody className="divide-y divide-white/5 font-sans text-xs">{children}</tbody>
);
const Tr = ({ children }: React.ComponentProps<'tr'>) => (
  <tr className="hover:bg-white/[0.02] even:bg-white/[0.01] transition-colors">{children}</tr>
);
const Td = ({ children }: React.ComponentProps<'td'>) => (
  <td className="px-4 py-2 text-secondary-txt/90">{children}</td>
);

const Details = ({ children }: React.ComponentProps<'details'>) => (
  <details className="my-3 border border-white/10 rounded-lg bg-black/20 overflow-hidden">{children}</details>
);
const Summary = ({ children }: React.ComponentProps<'summary'>) => (
  <summary className="px-4 py-2 bg-white/5 font-mono text-[10px] font-bold text-primary-txt/90 uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors select-none outline-none">{children}</summary>
);

export const createComponents = (themeColorClass: string, theme: 'online' | 'offline') => ({
  code({ node, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { node?: unknown; inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    const textContent = String(children).replace(/\n$/, '');
    const isInline = !className;

    if (!isInline && lang === 'mermaid') {
      return <MermaidBlock chart={textContent} />;
    }

    if (!isInline) {
      return (
        <CodeBlock content={textContent} lang={lang} themeColorClass={themeColorClass} />
      );
    }

    return (
      <code className={`bg-white/5 border border-white/10 px-1 py-0.5 rounded font-mono text-[12px] ${themeColorClass}`} {...props}>
        {children}
      </code>
    );
  },

  input({ type, checked, ...props }: React.ComponentProps<'input'>) {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className={`mt-1 mr-2 shrink-0 ${theme === 'offline' ? 'accent-offline-core' : 'accent-theme-accent'}`}
          {...props}
        />
      );
    }
    return <input type={type} checked={checked} {...props} />;
  },

  a({ href, children, ...props }: React.ComponentProps<'a'>) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`underline hover:text-white transition-colors ${themeColorClass}`}
        {...props}
      >
        {children}
      </a>
    );
  },

  th({ children }: React.ComponentProps<'th'>) {
    return <th className={`px-4 py-2 font-bold ${themeColorClass}`}>{children}</th>;
  },

  // Hoisted static renderers
  h1: H1, h2: H2, h3: H3, h4: H4,
  blockquote: Blockquote,
  ul: Ul, ol: Ol,
  table: Table, thead: Thead, tbody: Tbody, tr: Tr, td: Td,
  hr: Hr,
  p: P,
  details: Details, summary: Summary,
});
