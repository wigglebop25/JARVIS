import { Terminal } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { prompt: "/status", label: "System Status", desc: "Run node diagnostics & diagnostics metrics" },
  { prompt: "Show system metrics", label: "Analyze Metrics", desc: "View detailed CPU, RAM & disk specs" },
  { prompt: "Explain device controls", label: "Device Guide", desc: "Learn wifi, bluetooth & recording commands" }
];

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

export const SuggestedPrompts = ({ onSelect }: SuggestedPromptsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {SUGGESTED_PROMPTS.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(item.prompt)}
          className="flex flex-col text-left p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-offline-core/5 hover:border-offline-core/20 hover:shadow-[0_0_15px_rgba(244,244,245,0.02)] transition-all duration-300 group cursor-pointer outline-none"
        >
          <div className="flex items-center gap-2 mb-1 text-offline-core/50 group-hover:text-offline-core transition-colors">
            <Terminal size={11} />
            <span className="text-[8px] font-mono uppercase tracking-wider font-bold">
              {item.label}
            </span>
          </div>
          <span className="text-[11px] font-mono text-secondary-txt/90 group-hover:text-white font-bold mb-1">
            {item.prompt}
          </span>
          <span className="text-[9px] font-sans text-secondary-txt/40 leading-snug">
            {item.desc}
          </span>
        </button>
      ))}
    </div>
  );
};
