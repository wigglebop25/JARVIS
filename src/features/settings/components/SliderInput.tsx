interface SliderInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  labelLeft: string;
  labelRight: string;
  decimals?: number;
  suffix?: string;
}

export const SliderInput = ({ id, value, onChange, min, max, step, labelLeft, labelRight, decimals = 2, suffix = '' }: SliderInputProps) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-sans text-tertiary-txt">{labelLeft}</span>
        <span className="text-sm font-mono font-semibold text-[var(--theme-accent)] drop-shadow-[0_0_8px_rgba(var(--theme-accent-rgb),0.3)]">
          {value.toFixed(decimals)}{suffix}
        </span>
        <span className="text-xs font-sans text-tertiary-txt">{labelRight}</span>
      </div>
      <div className="relative group cursor-pointer">
        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
          <div
            className="h-full bg-[var(--theme-accent)] transition-all duration-100 shadow-[0_0_10px_rgba(var(--theme-accent-rgb),0.5)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[var(--theme-accent)] shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.8)] transition-all duration-100 pointer-events-none group-hover:scale-125"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};
