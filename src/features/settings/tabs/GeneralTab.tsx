import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, Info } from 'lucide-react';
import { AppConfig, PROVIDER_MODEL_SUGGESTIONS, PROVIDER_BASE_URLS } from '@/services/configService';
import { useTheme } from '@/context/ThemeContext';
import { SectionHeader, FieldGroup } from '../components/FieldGroup';

interface TabProps {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  accent: string;
}

export const GeneralTab = ({ config, updateConfig }: TabProps) => {
  const { theme, setTheme } = useTheme();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  const isLocalUrl = config.chat_base_url.includes('127.0.0.1') || config.chat_base_url.includes('localhost');
  const modelSuggestions = PROVIDER_MODEL_SUGGESTIONS[config.provider] || [];
  const isOffline = (sessionStorage.getItem('jarvis_mode') || 'online') === 'offline';

  return (
    <div className="space-y-7">
      <SectionHeader title="Model_Configuration" subtitle="Active LLM neural endpoint selection" />

      {!isOffline && (
        <FieldGroup label="Visual Interface Theme" description="Switch the color protocol for online mode elements.">
          <div className="relative">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="jarvis">JARVIS (Cyan)</option>
              <option value="cyberpunk">Cyberpunk (Pink)</option>
              <option value="amber">Amber (Warm)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-txt pointer-events-none" />
          </div>
        </FieldGroup>
      )}

      <FieldGroup label="Provider" description="Select the LLM backend provider">
        <select
          value={config.provider}
          onChange={(e) => updateConfig('provider', e.target.value as AppConfig['provider'])}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors appearance-none cursor-pointer"
        >
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </FieldGroup>

      <FieldGroup label="API Key" description="Authentication key for the LLM endpoint">
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.api_key}
            onChange={(e) => updateConfig('api_key', e.target.value)}
            placeholder={isLocalUrl ? 'Local endpoint — no key required' : 'sk-...'}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors pr-8"
          />
          <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-secondary-txt hover:text-white cursor-pointer">
            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </FieldGroup>

      <FieldGroup label="Model" description="Model identifier for the selected provider">
        <div className="relative">
          <input
            type="text"
            value={config.chat_model}
            onChange={(e) => updateConfig('chat_model', e.target.value)}
            onFocus={() => setShowModelSuggestions(true)}
            onBlur={() => setTimeout(() => setShowModelSuggestions(false), 200)}
            placeholder={modelSuggestions[0] || 'gpt-4o'}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
          />
          {showModelSuggestions && modelSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-surface-1 border border-white/10 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
              {modelSuggestions.map((m: string) => (
                <button key={m} onMouseDown={() => updateConfig('chat_model', m)} className="w-full text-left px-3 py-2 text-[11px] font-mono text-secondary-txt hover:bg-white/5 hover:text-white transition-colors cursor-pointer">
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </FieldGroup>

      <FieldGroup label="Base URL" description="API endpoint URL for your LLM provider">
        <input
          type="text"
          value={config.chat_base_url}
          onChange={(e) => updateConfig('chat_base_url', e.target.value)}
          placeholder={PROVIDER_BASE_URLS[config.provider] || 'https://api.openai.com/v1'}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
        />
      </FieldGroup>

      {isLocalUrl && (
        <div className="flex items-start gap-2 p-3 bg-info-blue/5 border border-info-blue/20 rounded-lg">
          <Info size={14} className="text-info-blue shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono text-info-blue leading-relaxed">
            Local endpoint detected. API keys may not be required for local inference.
          </p>
        </div>
      )}
    </div>
  );
};
