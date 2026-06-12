import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Cpu, Mic, Server,
  RefreshCcw, Save, RotateCcw, Check
} from 'lucide-react';
import {
  AppConfig, DEFAULT_CONFIG, getConfig, saveConfig, resetConfig
} from '@/services/configService';
import { GeneralTab } from '@/features/settings/tabs/GeneralTab';
import { VoiceTab } from '@/features/settings/tabs/VoiceTab';
import { SystemTab } from '@/features/settings/tabs/SystemTab';

type SettingsTab = 'general' | 'voice' | 'system';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [currentMode] = useState(() => sessionStorage.getItem('jarvis_mode') || 'online');
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [config, setConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialConfig, setInitialConfig] = useState<AppConfig>({ ...DEFAULT_CONFIG });

  useEffect(() => {
    if (isOpen) {
      getConfig().then((loaded) => {
        const merged = { ...DEFAULT_CONFIG, ...loaded };
        setConfig(merged);
        setInitialConfig(merged);
        setHasChanges(false);
        setSaveStatus('idle');
      });
    }
  }, [isOpen]);

  const updateConfig = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig(prev => {
      const next = { ...prev, [key]: value };
      setHasChanges(JSON.stringify(next) !== JSON.stringify(initialConfig));
      return next;
    });
    setSaveStatus('idle');
  };

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

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Cpu size={14} /> },
    { id: 'voice', label: 'Voice', icon: <Mic size={14} /> },
    { id: 'system', label: 'System', icon: <Server size={14} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full max-w-4xl h-[600px] border rounded-xl overflow-hidden shadow-2xl flex flex-col ${
              isOffline ? 'border-offline-border bg-offline-bg' : 'border-theme-border bg-theme-bg'
            }`}
            style={isOffline ? {
              '--theme-accent': 'var(--color-offline-core)',
              '--theme-accent-rgb': 'var(--color-offline-core-rgb)'
            } as React.CSSProperties : undefined}
          >
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
                <button onClick={onClose} className="text-secondary-txt hover:text-white transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="w-48 border-r border-white/5 p-3 flex flex-col gap-1 shrink-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-sans font-bold text-xs uppercase tracking-wider cursor-pointer transition-all text-left w-full
                      ${activeTab === tab.id
                        ? 'bg-white/10 text-white border-l-2 border-[var(--theme-accent)] shadow-[inset_20px_0_40px_-20px_rgba(var(--theme-accent-rgb),0.1)]'
                        : 'text-secondary-txt hover:bg-white/5 border-l-2 border-transparent hover:text-white'
                      }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}

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
                    className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all group cursor-pointer"
                  >
                    <RefreshCcw size={12} className="text-secondary-txt group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-secondary-txt group-hover:text-white transition-colors">Reboot</span>
                  </button>
                </div>
              </div>

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
                      {activeTab === 'general' && <GeneralTab config={config} updateConfig={updateConfig} accent="" />}
                      {activeTab === 'voice' && <VoiceTab config={config} updateConfig={updateConfig} accent="" />}
                      {activeTab === 'system' && <SystemTab config={config} updateConfig={updateConfig} accent="" />}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="shrink-0 px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 text-secondary-txt hover:text-error-red border border-transparent hover:border-error-red/30 rounded-lg transition-all text-xs font-mono uppercase tracking-wider cursor-pointer"
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
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer
                        ${hasChanges
                          ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/30 hover:bg-[var(--theme-accent)]/20 hover:scale-105 shadow-[0_0_15px_rgba(var(--theme-accent-rgb),0.15)] active:scale-95'
                          : 'bg-white/5 text-tertiary-txt border border-white/5 cursor-not-allowed'
                        }`}
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
