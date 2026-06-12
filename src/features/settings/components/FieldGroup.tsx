export const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-3">
    <h3 className="text-sm font-sans text-primary-txt uppercase tracking-wider font-bold">{title}</h3>
    <p className="text-xs font-sans text-secondary-txt/80 mt-1 leading-relaxed">{subtitle}</p>
  </div>
);

export const FieldGroup = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <label className="block text-xs font-sans font-bold text-secondary-txt/95 uppercase tracking-wider">{label}</label>
    {children}
    {description && (
      <p className="text-xs font-sans text-tertiary-txt/90 leading-relaxed">{description}</p>
    )}
  </div>
);
