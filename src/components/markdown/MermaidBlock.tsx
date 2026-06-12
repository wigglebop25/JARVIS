import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { mermaidCache } from './cache';

interface MermaidBlockProps {
  chart: string;
  isStreaming?: boolean;
}

export const MermaidBlock = ({ chart, isStreaming = false }: MermaidBlockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

    if (isStreaming) {
      setSvg('');
      setError(null);
      return;
    }

    setSvg('');
    setError(null);

    let active = true;
    const renderChart = async () => {
      if (!containerRef.current) return;
      if (!cleanChart) return;
      const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
      try {
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart);

        if (active) {
          mermaidCache.set(cleanChart, renderedSvg);
          setSvg(renderedSvg);
        }
      } catch (err: unknown) {
        console.error('Mermaid render error:', err);

        const tempElement = document.getElementById('d' + id);
        if (tempElement) tempElement.remove();
        const tempElement2 = document.getElementById(id);
        if (tempElement2) tempElement2.remove();

        if (active) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          setError(errorMsg.split('\n')[0] || 'Diagram syntax error');
        }
      }
    };

    debounceRef.current = setTimeout(renderChart, 300);

    return () => {
      active = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [cleanChart, isStreaming]);

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

  if (isStreaming && !svg) {
    return (
      <div className="relative border border-white/10 rounded-lg overflow-hidden bg-black/40 my-3.5 p-4 flex justify-center items-center min-h-[3rem]">
        <div className="absolute top-2 right-2 text-[8px] font-mono text-secondary-txt/30 uppercase tracking-widest pointer-events-none select-none">
          Diagram_Canvas
        </div>
        <div className="text-[11px] text-secondary-txt/40 font-mono animate-pulse flex items-center gap-1.5">
          <span className="inline-block w-2 h-3 bg-secondary-txt/30 animate-pulse" />
          rendering diagram…
        </div>
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
