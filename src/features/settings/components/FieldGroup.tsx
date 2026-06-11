export const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div>
    <h3 className="text-xs font-mono font-bold text-primary-txt uppercase tracking-widest">{title}</h3>
    {subtitle && <p className="text-[10px] font-mono text-secondary-txt/50 mt-0.5">{subtitle}</p>}
  </div>
);

export const FieldGroup = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div>
      <label className="text-[11px] font-mono text-primary-txt/80 uppercase tracking-wider font-semibold">
        {label}
      </label>
      {description && <p className="text-[9px] font-mono text-secondary-txt/40 mt-0.5">{description}</p>}
    </div>
    {children}
  </div>
);
