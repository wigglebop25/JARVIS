import { useState } from 'react';
import { Eye, EyeOff, ChevronDown, Info, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
              className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-sans text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 appearance-none cursor-pointer"
            >
              <option value="jarvis" className="bg-[#121214] text-white">Default Protocol (Jarvis Blue)</option>
              <option value="cyberpunk" className="bg-[#121214] text-white">Cyberpunk Protocol (Neon Pink/Purple)</option>
              <option value="amber" className="bg-[#121214] text-white">Amber Protocol (Tactical Orange)</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-txt pointer-events-none" />
          </div>
        </FieldGroup>
      )}

      <FieldGroup label="Active Provider" description="Primary LLM service endpoint">
        <div className="relative">
          <select
            value={config.provider}
            onChange={(e) => {
              const provider = e.target.value as AppConfig['provider'];
              updateConfig('provider', provider);
              const knownUrls = Object.values(PROVIDER_BASE_URLS);
              if (!config.chat_base_url || knownUrls.includes(config.chat_base_url)) {
                updateConfig('chat_base_url', PROVIDER_BASE_URLS[provider] || '');
              }
            }}
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-sans text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="openai" className="bg-[#121214] text-white">OpenAI</option>
            <option value="gemini" className="bg-[#121214] text-white">Gemini</option>
            <option value="anthropic" className="bg-[#121214] text-white">Anthropic</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-txt pointer-events-none" />
        </div>
      </FieldGroup>

      <FieldGroup label="API Key" description={isLocalUrl ? 'Not required for local endpoints' : 'Credential for the selected provider'}>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            value={config.api_key}
            onChange={(e) => updateConfig('api_key', e.target.value)}
            disabled={isLocalUrl}
            placeholder={isLocalUrl ? 'sk-local (not required)' : 'Enter API key...'}
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed pr-12 shadow-inner"
          />
          <button
            onClick={() => setShowApiKey(!showApiKey)}
            disabled={isLocalUrl}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-txt hover:text-white transition-colors disabled:opacity-30"
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </FieldGroup>

      <FieldGroup label="Chat Model" description="Model identifier for the active provider">
        <div className="relative">
          <input
            type="text"
            value={config.chat_model}
            onChange={(e) => updateConfig('chat_model', e.target.value)}
            onFocus={() => setShowModelSuggestions(true)}
            onBlur={() => setTimeout(() => setShowModelSuggestions(false), 150)}
            placeholder="e.g. gpt-4o, claude-3-5-sonnet..."
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300"
          />
          <AnimatePresence>
            {showModelSuggestions && modelSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute z-20 top-full mt-1 w-full bg-surface-2 border border-white/10 rounded-lg shadow-2xl overflow-hidden"
              >
                {modelSuggestions.map((model) => (
                  <button
                    key={model}
                    onMouseDown={() => {
                      updateConfig('chat_model', model);
                      setShowModelSuggestions(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-mono transition-colors hover:bg-white/5
                      ${config.chat_model === model ? 'text-[var(--theme-accent)]' : 'text-secondary-txt'}
                    `}
                  >
                    {model}
                    {config.chat_model === model && <Check size={12} className="inline ml-2" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FieldGroup>

      <FieldGroup label="Base URL" description="LLM API endpoint. Use local URLs for LMStudio/Ollama.">
        <div className="relative">
          <input
            type="text"
            value={config.chat_base_url}
            onChange={(e) => updateConfig('chat_base_url', e.target.value)}
            placeholder={PROVIDER_BASE_URLS[config.provider] || 'https://api.openai.com/v1'}
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner"
          />
          {isLocalUrl && (
            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-success-green/70">
              <Info size={10} />
              <span>Local endpoint detected — API key authentication bypassed</span>
            </div>
          )}
        </div>
      </FieldGroup>
    </div>
  );
};
