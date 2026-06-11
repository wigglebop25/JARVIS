import { AppConfig } from '@/services/configService';
import { MicTester } from '../components/MicTester';
import { SectionHeader, FieldGroup } from '../components/FieldGroup';

interface TabProps {
  config: AppConfig;
  updateConfig: <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => void;
  accent: string;
}

export const VoiceTab = ({ config, updateConfig }: TabProps) => {
  return (
    <div className="space-y-7">
      <SectionHeader title="Voice_Input_Configuration" subtitle="Configure speech recognition and audio input settings" />

      <FieldGroup label="VAD Threshold" description="Voice activity detection sensitivity (lower = more sensitive)">
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(config.vad_threshold * 100)}
          onChange={(e) => updateConfig('vad_threshold', parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
          className="w-full accent-[var(--theme-accent)]"
        />
        <span className="text-[10px] font-mono text-secondary-txt">{config.vad_threshold.toFixed(2)}</span>
      </FieldGroup>

      <FieldGroup label="Silence RMS Threshold" description="Audio level below which is considered silence">
        <input
          type="range"
          min={1}
          max={100}
          value={Math.round(config.silence_threshold_rms * 100)}
          onChange={(e) => updateConfig('silence_threshold_rms', parseFloat((parseInt(e.target.value) / 100).toFixed(2)))}
          className="w-full accent-[var(--theme-accent)]"
        />
        <span className="text-[10px] font-mono text-secondary-txt">{config.silence_threshold_rms.toFixed(2)}</span>
      </FieldGroup>

      <FieldGroup label="Silence Duration (ms)" description="How long silence must last before stopping">
        <input
          type="number"
          value={config.silence_duration_ms}
          onChange={(e) => updateConfig('silence_duration_ms', parseInt(e.target.value))}
          min={100}
          max={5000}
          step={100}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
        />
      </FieldGroup>

      <FieldGroup label="Transcription Model" description="Local voice-to-text model path">
        <input
          type="text"
          value={config.transcription_model_path}
          onChange={(e) => updateConfig('transcription_model_path', e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] font-mono text-primary-txt outline-none focus:border-[var(--theme-accent)]/50 transition-colors"
        />
      </FieldGroup>

      <FieldGroup label="Hardware Test" description="Verify your microphone is working correctly">
          <MicTester />
      </FieldGroup>
    </div>
  );
};
