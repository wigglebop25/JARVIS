import { AppConfig } from '@/services/configService';
import { MicTester } from '../components/MicTester';
import { SectionHeader, FieldGroup } from '../components/FieldGroup';
import { SliderInput } from '../components/SliderInput';

interface TabProps {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  accent: string;
}

export const VoiceTab = ({ config, updateConfig }: TabProps) => {
  return (
    <div className="space-y-7">
      <SectionHeader title="Audio_Voice_Settings" subtitle="Voice activation and transcription parameters" />

      <FieldGroup label="Hardware Test" description="Verify your microphone is working correctly">
          <MicTester />
      </FieldGroup>

      <FieldGroup label="VAD Threshold" description="Voice activity detection sensitivity (lower = more sensitive)">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(config.vad_threshold * 100)}
          onChange={(e) => updateConfig('vad_threshold', parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
          className="w-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/10 rounded-lg px-4 py-3 text-sm font-mono text-primary-txt focus:outline-none focus:border-[var(--theme-accent)]/50 focus:ring-1 focus:ring-[var(--theme-accent)]/30 transition-all duration-300 accent-[var(--theme-accent)]"
        />
        <span className="text-[10px] font-mono text-secondary-txt">{config.vad_threshold.toFixed(2)}</span>
      </FieldGroup>

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

      <FieldGroup label="Auto-Stop Silence Delay" description="Minimum silence duration before auto-stopping transcription.">
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
      </FieldGroup>

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
