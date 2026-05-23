import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Cpu, Mic, MicOff, Server,
  RefreshCcw, Save, RotateCcw, Eye, EyeOff,
  ChevronDown, Check, Info
} from 'lucide-react';
import {
  AppConfig, DEFAULT_CONFIG, PROVIDER_MODEL_SUGGESTIONS, PROVIDER_BASE_URLS,
  getConfig, saveConfig, resetConfig
} from '@/services/configService';

// ─── Types ──────────────────────────────────────────────────────────────────

type SettingsTab = 'general' | 'voice' | 'system';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const currentMode = sessionStorage.getItem('jarvis_mode') || 'online';
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [config, setConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialConfig, setInitialConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG });

  // Load config when modal opens
  useEffect(() => {
    if (isOpen) {
      getConfig().then((loaded) => {
        setConfig(loaded);
        setInitialConfig(loaded);
        setHasChanges(false);
        setSaveStatus('idle');
      });
    }
  }, [isOpen]);

  const updateConfig = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(next) !== JSON.stringify(initialConfig));
      return next;
    });
    setSaveStatus('idle');
  }, [initialConfig]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveConfig(config);
      setInitialConfig(config);
      setHasChanges(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const defaults = await resetConfig();
    setConfig(defaults);
    setInitialConfig(defaults);
    setHasChanges(false);
    setSaveStatus('idle');
  };

  const handleSwitchMode = () => {
    sessionStorage.removeItem('jarvis_mode');
    onClose();
    window.dispatchEvent(new Event('go-to-selection'));
  };

  const isOffline = currentMode === 'offline';
  const accent = isOffline ? 'offline-core' : 'jarvis-blue';

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Cpu size={14} /> },
    { id: 'voice', label: 'Voice', icon: <Mic size={14} /> },
    { id: 'system', label: 'System', icon: <Server size={14} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-4xl h-[600px] border rounded-xl overflow-hidden shadow-2xl flex flex-col
              ${isOffline ? 'border-offline-border bg-offline-bg' : 'border-jarvis-blue/30 bg-base'}
            `}
            style={{
              '--theme-accent': isOffline ? 'var(--color-offline-core)' : 'var(--color-jarvis-blue)',
              '--theme-accent-rgb': isOffline ? 'var(--color-offline-core-rgb)' : '0, 240, 255'
            } as React.CSSProperties}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5 shrink-0">
              <h2 className="font-sans font-bold uppercase tracking-wider text-xs text-[var(--theme-accent)]">
                SYSTEM_CONFIG // {currentMode.toUpperCase()}_NODE
              </h2>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[9px] font-mono text-warning-orange uppercase tracking-widest"
                  >
                    Unsaved_Changes
                  </motion.span>
                )}
                <button onClick={onClose} className="text-secondary-txt hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar */}
              <div className="w-48 border-r border-white/5 p-3 flex flex-col gap-1 shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-sans font-bold text-xs uppercase tracking-wider cursor-pointer transition-all text-left w-full
                      ${activeTab === tab.id
                        ? `bg-white/10 text-white border-l-2 border-[var(--theme-accent)] shadow-[inset_20px_0_40px_-20px_rgba(var(--theme-accent-rgb),0.1)]`
                        : 'text-secondary-txt hover:bg-white/5 border-l-2 border-transparent hover:text-white'
                      }
                    `}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}

                {/* Mode Switch in sidebar */}
                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="px-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-offline-core shadow-[0_0_6px_var(--color-offline-core)]' : 'bg-success-green shadow-[0_0_6px_#00FF66]'} animate-pulse`} />
                      <span className="text-[9px] font-mono text-secondary-txt uppercase tracking-wider">
                        {isOffline ? 'Air_Gapped' : 'Cloud_Sync'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleSwitchMode}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all group"
                  >
                    <RefreshCcw size={12} className="text-secondary-txt group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-secondary-txt group-hover:text-white transition-colors">Reboot</span>
                  </button>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15 }}
                    >
                      {activeTab === 'general' && (
                        <GeneralTab config={config} updateConfig={updateConfig} accent={accent} />
                      )}
                      {activeTab === 'voice' && (
                        <VoiceTab config={config} updateConfig={updateConfig} accent={accent} />
                      )}
                      {activeTab === 'system' && (
                        <SystemTab config={config} updateConfig={updateConfig} accent={accent} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-secondary-txt hover:text-error-red border border-transparent hover:border-error-red/30 rounded-lg transition-all text-xs font-mono uppercase tracking-wider"
                  >
                    <RotateCcw size={14} />
                    Reset_Defaults
                  </button>

                  <div className="flex items-center gap-3">
                    {saveStatus === 'saved' && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-1.5 text-success-green text-[10px] font-mono uppercase tracking-widest"
                      >
                        <Check size={12} />
                        Config_Saved
                      </motion.span>
                    )}
                    {saveStatus === 'error' && (
                      <span className="text-error-red text-[10px] font-mono uppercase tracking-widest">Save_Failed</span>
                    )}
                    <button
                      onClick={handleSave}
                      disabled={!hasChanges || isSaving}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300
                        ${hasChanges
                          ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 hover:bg-[var(--theme-accent)]/20 hover:scale-105 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.15)] active:scale-95'
                          : 'bg-white/5 text-tertiary-txt border border-white/5 cursor-not-allowed'
                        }
                      `}
                    >
                      <Save size={14} />
                      {isSaving ? 'Saving...' : 'Save_Config'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Tab Components ─────────────────────────────────────────────────────────

interface TabProps {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  accent: string;
}

// ─── General Tab ────────────────────────────────────────────────────────────

const GeneralTab = ({ config, updateConfig, accent }: TabProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  const isLocalUrl = config.chat_base_url.includes('127.0.0.1') || config.chat_base_url.includes('localhost');
  const modelSuggestions = PROVIDER_MODEL_SUGGESTIONS[config.provider] || [];

  return (
    <div className="space-y-7">
      <SectionHeader title="Model_Configuration" subtitle="Active LLM neural endpoint selection" />

      {/* Provider Dropdown */}
      <FieldGroup label="Active Provider" description="Primary LLM service endpoint">
        <div className="relative">
          <select
            id="settings-provider"
            value={config.provider}
            onChange={(e) => {
              const provider = e.target.value as AppConfig['provider'];
              updateConfig('provider', provider);
              // Auto-fill base URL if current URL is a known provider default or empty
              const knownUrls = Object.values(PROVIDER_BASE_URLS);
              if (!config.chat_base_url || knownUrls.includes(config.chat_base_url)) {
                updateConfig('chat_base_url', PROVIDER_BASE_URLS[provider] || '');
              }
            }}
            className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-sans text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 appearance-none cursor-pointer"
          >
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
            <option value="anthropic">Anthropic</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-txt pointer-events-none" />
        </div>
      </FieldGroup>

      {/* API Key */}
      <FieldGroup label="API Key" description={isLocalUrl ? 'Not required for local endpoints' : 'Credential for the selected provider'}>
        <div className="relative">
          <input
            id="settings-api-key"
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

      {/* Chat Model */}
      <FieldGroup label="Chat Model" description="Model identifier for the active provider">
        <div className="relative">
          <input
            id="settings-chat-model"
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
                      ${config.chat_model === model ? `text-${accent}` : 'text-secondary-txt'}
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

      {/* Base URL */}
      <FieldGroup label="Base URL" description="LLM API endpoint. Use local URLs for LMStudio/Ollama.">
        <input
          id="settings-base-url"
          type="text"
          value={config.chat_base_url}
          onChange={(e) => updateConfig('chat_base_url', e.target.value)}
          placeholder="http://127.0.0.1:1234/v1"
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner"
        />
        {isLocalUrl && (
          <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-success-green/70">
            <Info size={10} />
            <span>Local endpoint detected — API key authentication bypassed</span>
          </div>
        )}
      </FieldGroup>
    </div>
  );
};

// ─── Voice Tab ──────────────────────────────────────────────────────────────

const VoiceTab = ({ config, updateConfig }: TabProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animationFrameId: number;

    if (isTesting && stream) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          throw new Error("Web Audio API is not supported in this environment.");
        }

        audioContext = new AudioContextClass();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateLevel = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          // Scale to a realistic volume metric between 0 and 100
          const scaledLevel = Math.min(100, Math.round((average / 120) * 100));
          setMicLevel(scaledLevel);
          animationFrameId = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err: any) {
        console.error("Mic test setup error:", err);
        setMicError(err.message || "Failed to initialize audio context.");
        setIsTesting(false);
      }
    } else {
      setMicLevel(0);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) audioContext.close().catch(console.error);
    };
  }, [isTesting, stream]);

  const toggleMicTest = async () => {
    setMicError(null);
    if (isTesting) {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      setStream(null);
      setIsTesting(false);
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Microphone access is not supported or blocked by WebView permissions.");
        }
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setStream(micStream);
        setIsTesting(true);
      } catch (err: any) {
        console.error("Failed mic stream capture:", err);
        setMicError(err.message || "Microphone access denied. Check system permissions.");
      }
    }
  };

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Map VAD sensitivity slider (0 to 1) directly to a gate percentage (0 to 100)
  const thresholdPercentage = config.vad_threshold * 100;
  const isSpeechDetected = isTesting && micLevel >= thresholdPercentage;

  return (
    <div className="space-y-7">
      <SectionHeader title="Audio_Voice_Settings" subtitle="Voice activation and transcription parameters" />

      {/* Voice Tester Console Widget */}
      <div className="bg-black/20 border border-white/5 rounded-xl p-5 space-y-4 shadow-sm hover:border-white/10 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-sans font-bold text-primary-txt uppercase tracking-wider">Voice Test Console</h4>
            <p className="text-[11px] font-sans text-tertiary-txt">Real hardware feed to safely test gate sensitivity thresholds.</p>
          </div>
          <button
            type="button"
            onClick={toggleMicTest}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 ${isTesting
                ? 'bg-error-red/10 text-error-red border border-error-red/30 shadow-[0_0_15px_rgba(255,0,0,0.15)] animate-pulse'
                : 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 hover:bg-[var(--theme-accent)]/20 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.15)]'
              }`}
          >
            {isTesting ? <MicOff size={14} /> : <Mic size={14} />}
            {isTesting ? 'Stop Test' : 'Start Test'}
          </button>
        </div>

        {micError && (
          <div className="text-xs font-sans text-error-red bg-error-red/10 px-3 py-2 rounded-md border border-error-red/20">
            [ERROR]: {micError}
          </div>
        )}

        {/* Level Indicator Bar */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-[11px] font-sans text-secondary-txt/80">
            <span>HARDWARE INPUT LEVEL</span>
            <span className={isSpeechDetected ? "text-success-green font-bold drop-shadow-[0_0_8px_#00FF66] transition-all" : "text-tertiary-txt transition-all"}>
              {isSpeechDetected ? "SPEECH_DETECTED // ACTIVE" : isTesting ? "TESTING // AMBIENT" : "INACTIVE // CLICK START"}
            </span>
          </div>

          <div className="relative h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
            {/* Live Feed Bar */}
            <div
              className={`h-full transition-all duration-75 ${isSpeechDetected
                  ? 'bg-gradient-to-r from-success-green to-success-green/80 shadow-[0_0_10px_#00FF66]'
                  : 'bg-[var(--theme-accent)]'
                }`}
              style={{ width: `${isTesting ? micLevel : 0}%` }}
            />
            {/* Gate indicator line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-error-red/80 shadow-[0_0_5px_#FF3333] z-10 transition-all duration-100"
              style={{ left: `${thresholdPercentage}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-tertiary-txt/60">
            <span>0%</span>
            <span style={{ marginLeft: `${thresholdPercentage - 5}%` }} className="text-error-red font-semibold">GATE ({thresholdPercentage.toFixed(0)}%)</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* VAD Threshold */}
      <FieldGroup label="VAD Sensitivity" description="Speech detection threshold. Lower = more sensitive to quiet speech.">
        <SliderInput
          id="settings-vad-threshold"
          value={config.vad_threshold}
          onChange={(v) => updateConfig('vad_threshold', v)}
          min={0}
          max={1}
          step={0.05}
          labelLeft="Sensitive"
          labelRight="Loud Speech"
        />
      </FieldGroup>

      {/* Silence Threshold RMS */}
      <FieldGroup label="Silence Energy Gate" description="RMS audio energy threshold for ambient noise filtering.">
        <SliderInput
          id="settings-silence-rms"
          value={config.silence_threshold_rms}
          onChange={(v) => updateConfig('silence_threshold_rms', v)}
          min={0}
          max={0.1}
          step={0.001}
          labelLeft="No Gate"
          labelRight="Heavy Filter"
          decimals={3}
        />
      </FieldGroup>

      {/* Silence Duration */}
      <FieldGroup label="Auto-Stop Silence Delay" description="Minimum silence duration before auto-stopping transcription.">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SliderInput
              id="settings-silence-duration"
              value={config.silence_duration_ms}
              onChange={(v) => updateConfig('silence_duration_ms', v)}
              min={500}
              max={5000}
              step={100}
              labelLeft="500ms"
              labelRight="5000ms"
              decimals={0}
              suffix="ms"
            />
          </div>
        </div>
      </FieldGroup>

      {/* Transcription Model Path */}
      <FieldGroup label="Voice Model" description="Folder name for local Whisper/Parakeet weight files.">
        <input
          id="settings-transcription-model"
          type="text"
          value={config.transcription_model_path}
          onChange={(e) => updateConfig('transcription_model_path', e.target.value)}
          placeholder="parakeet-tdt-0.6b-v3-int8"
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 shadow-inner"
        />
      </FieldGroup>
    </div>
  );
};

// ─── System Tab ─────────────────────────────────────────────────────────────

const SystemTab = ({ config, updateConfig }: TabProps) => {
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
    </div>
  );
};

// ─── Shared UI Components ───────────────────────────────────────────────────

const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-3">
    <h3 className="text-sm font-sans text-primary-txt uppercase tracking-wider font-bold">{title}</h3>
    <p className="text-xs font-sans text-secondary-txt/80 mt-1 leading-relaxed">{subtitle}</p>
  </div>
);

const FieldGroup = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-2.5">
    <label className="block text-xs font-sans font-bold text-secondary-txt/95 uppercase tracking-wider">{label}</label>
    {children}
    {description && (
      <p className="text-xs font-sans text-tertiary-txt/90 leading-relaxed">{description}</p>
    )}
  </div>
);

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

const SliderInput = ({ id, value, onChange, min, max, step, labelLeft, labelRight, decimals = 2, suffix = '' }: SliderInputProps) => {
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
        {/* Thumb indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[var(--theme-accent)] shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.8)] transition-all duration-100 pointer-events-none group-hover:scale-125"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};