import { AppConfig } from '@/services/configService';
import { SectionHeader, FieldGroup } from '../components/FieldGroup';

interface TabProps {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  accent: string;
}

export const SystemTab = ({ config, updateConfig }: TabProps) => {
  return (
    <div className="space-y-7">
      <SectionHeader title="System_Preferences" subtitle="Tune JARVIS behavior and resource allocation parameters" />

      <FieldGroup label="Database Name" description="SQLite database file for session and memory persistence">
        <input
          type="text"
          value={config.database_name}
          onChange={(e) => updateConfig('database_name', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
        />
      </FieldGroup>

      <FieldGroup label="Compaction Threshold" description="Context length at which compaction is triggered">
        <input
          type="number"
          value={config.compaction_threshold}
          onChange={(e) => updateConfig('compaction_threshold', parseInt(e.target.value))}
          min={1024}
          max={512000}
          step={1024}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
        />
      </FieldGroup>

      <FieldGroup label="Sandbox Directory" description="Root directory for document reading/writing operations">
        <input
          type="text"
          value={config.sandbox_dir}
          onChange={(e) => updateConfig('sandbox_dir', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
        />
      </FieldGroup>

      <FieldGroup label="System Prompt" description="Core instruction set for the AI assistant">
        <textarea
          value={config.system_prompt}
          onChange={(e) => updateConfig('system_prompt', e.target.value)}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors resize-none"
        />
      </FieldGroup>

      <FieldGroup label="Compaction Prompt" description="Template for summarizing conversation context">
        <textarea
          value={config.compaction_prompt}
          onChange={(e) => updateConfig('compaction_prompt', e.target.value)}
          rows={3}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors resize-none"
        />
      </FieldGroup>
    </div>
  );
};
