import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
import { createComponents } from '@/components/markdown/components';

try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'strict',
    suppressErrorRendering: true,
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

interface MarkdownRendererProps {
  content: string;
  theme?: 'online' | 'offline';
  trustedSource?: boolean;
  isStreaming?: boolean;
}

export const MarkdownRenderer = ({ content, theme = 'offline', trustedSource = false, isStreaming = false }: MarkdownRendererProps) => {
  if (!content) return null;

  const themeColorClass = theme === 'offline' ? 'text-offline-core' : 'text-theme-accent';

  let processed = content;
  processed = processed.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, '$$\n$1\n$$');
  processed = processed.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, '$$1$');

  const components = createComponents(themeColorClass, theme, isStreaming);
  const rehypePlugins = trustedSource ? [rehypeRaw, rehypeKatex] : [rehypeKatex];

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {processed}
    </ReactMarkdown>
  );
};
