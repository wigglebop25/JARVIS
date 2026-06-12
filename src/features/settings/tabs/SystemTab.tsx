import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { AppConfig } from '@/services/configService';
import { restartAgent, onAgentStatus } from '@/services/agentService';
import { SectionHeader, FieldGroup } from '../components/FieldGroup';

interface TabProps {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  accent: string;
}

type AgentUIStatus = 'idle' | 'building' | 'ready' | 'error';

export const SystemTab = ({ config, updateConfig }: TabProps) => {
  const [agentStatus, setAgentStatus] = useState<AgentUIStatus>('idle');
  const [agentError, setAgentError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    onAgentStatus((payload) => {
      setAgentStatus(payload.status);
      if (payload.status === 'error') {
        setAgentError(payload.error ?? 'Unknown error');
      } else if (payload.status === 'ready') {
        setAgentError(null);
      }
    }).then((fn) => { unsub = fn; });
    return () => { unsub?.(); };
  }, []);

  const handleRestartAgent = async () => {
    if (agentStatus === 'building') return;
    setAgentStatus('building');
    setAgentError(null);
    try {
      await restartAgent();
    } catch (err) {
      console.error('[SystemTab] Failed to restart agent:', err);
      setAgentStatus('error');
      setAgentError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-7">
      <SectionHeader title="System_Configuration" subtitle="Persona, storage, and advanced parameters" />

      {/* System Prompt */}
      <FieldGroup label="System Persona" description="Instructions defining the LLM's persona and constraints.">
        <textarea
          id="settings-system-prompt"
          value={config.system_prompt}
          onChange={(e) => updateConfig('system_prompt', e.target.value)}
          placeholder="You are JARVIS, a helpful AI assistant."
          rows={4}
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-sans text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 resize-y min-h-[80px]"
        />
      </FieldGroup>

      {/* Compaction Prompt */}
      <FieldGroup label="Compaction Instruction" description="Prompt used when history exceeds context limits.">
        <textarea
          id="settings-compaction-prompt"
          value={config.compaction_prompt}
          onChange={(e) => updateConfig('compaction_prompt', e.target.value)}
          placeholder="Summarize this context briefly, capturing key points."
          rows={3}
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-sans text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 resize-y min-h-[60px]"
        />
      </FieldGroup>

      {/* Compaction Threshold */}
      <FieldGroup label="Compaction Threshold" description="Context token count at which history is compacted and summarized (Min: 1,000, Max: 1,000,000).">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const current = config.compaction_threshold || 0;
              const next = Math.max(1000, current - 5000);
              updateConfig('compaction_threshold', next);
            }}
            className="flex items-center justify-center w-12 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer text-secondary-txt hover:text-white font-mono font-bold text-sm shrink-0"
          >
            -
          </button>
          
          <input
            id="settings-compaction-threshold"
            type="number"
            min={1000}
            max={1000000}
            value={config.compaction_threshold || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!isNaN(val)) {
                updateConfig('compaction_threshold', Math.min(1000000, Math.max(0, val)));
              } else if (e.target.value === '') {
                updateConfig('compaction_threshold', 0);
              }
            }}
            onBlur={() => {
              if ((config.compaction_threshold || 0) < 1000) {
                updateConfig('compaction_threshold', 1000);
              }
            }}
            placeholder="128000"
            className="flex-1 min-w-[80px] bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt text-center focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={() => {
              const current = config.compaction_threshold || 0;
              const next = Math.min(1000000, current + 5000);
              updateConfig('compaction_threshold', next);
            }}
            className="flex items-center justify-center w-12 h-11 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer text-secondary-txt hover:text-white font-mono font-bold text-sm shrink-0"
          >
            +
          </button>
          
          <span className="text-xs font-mono text-secondary-txt select-none w-14 text-left pl-1">tokens</span>
        </div>
      </FieldGroup>

      {/* Database Name */}
      <FieldGroup label="Database Name" description="SQLite database filename for history storage.">
        <input
          id="settings-database-name"
          type="text"
          value={config.database_name}
          onChange={(e) => updateConfig('database_name', e.target.value)}
          placeholder="jarvis.db"
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner"
        />
      </FieldGroup>

      {/* MCP Config Path */}
      <FieldGroup label="MCP Config File" description="Path to MCP tool server registrations.">
        <input
          id="settings-mcp-config"
          type="text"
          value={config.mcp_config_path}
          onChange={(e) => updateConfig('mcp_config_path', e.target.value)}
          placeholder="mcp.json"
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner"
        />
      </FieldGroup>

      {/* Sandbox Directory */}
      <FieldGroup label="Sandbox Directory" description="Root directory for document reading/writing operations.">
        <input
          id="settings-sandbox-dir"
          type="text"
          value={config.sandbox_dir}
          onChange={(e) => updateConfig('sandbox_dir', e.target.value)}
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner"
        />
      </FieldGroup>

      {/* Restart Agent */}
      <div className="pt-4 mt-2 border-t border-white/10">
        <button
          type="button"
          onClick={handleRestartAgent}
          disabled={agentStatus === 'building'}
          className="flex items-center gap-2 px-4 py-2 text-secondary-txt hover:text-[var(--theme-accent)] border border-transparent hover:border-[var(--theme-accent)]/30 rounded-lg transition-all text-xs font-mono uppercase tracking-wider cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={14} className={agentStatus === 'building' ? 'animate-spin' : ''} />
          {agentStatus === 'building' ? 'Building...' : 'Restart_Agent'}
        </button>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              agentStatus === 'building'
                ? 'bg-warning-orange animate-pulse'
                : agentStatus === 'ready'
                  ? 'bg-success-green'
                  : agentStatus === 'error'
                    ? 'bg-error-red'
                    : 'bg-secondary-txt/40'
            }`}
          />
          <span className="text-[10px] font-mono uppercase tracking-wider text-secondary-txt/70">
            {agentStatus === 'building' && 'Building...'}
            {agentStatus === 'ready' && 'Agent_Ready'}
            {agentStatus === 'error' && `Build_Failed${agentError ? `: ${agentError.slice(0, 60)}` : ''}`}
            {agentStatus === 'idle' && 'Idle // Prebuild runs on startup'}
          </span>
        </div>
        <p className="mt-2 text-[10px] font-sans text-tertiary-txt/70 leading-relaxed">
          Clears the cached AI agent. The next chat prompt will rebuild it from the current configuration.
        </p>
      </div>
    </div>
  );
};
