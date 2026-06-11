import { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'lucide-react';

export const SLASH_COMMANDS = [
  { command: '/volume', description: 'Adjust system audio output level', args: '<0-100>' },
  { command: '/reboot', description: 'Restart the local host machine', args: '' },
  { command: '/translate', description: 'Translate on-screen text', args: '<target_lang>' },
  { command: '/obs-record', description: 'Toggle OBS screen recording', args: '<start|stop>' },
  { command: '/status', description: 'Display current system diagnostics', args: '' },
  { command: '/bluetooth', description: 'Toggle Bluetooth hardware radio', args: '<on|off>' },
  { command: '/wifi', description: 'Toggle Wi-Fi hardware radio', args: '<on|off>' },
  { command: '/wol', description: 'Wake a device via Wake-on-LAN', args: '<device_name>' },
];

interface SlashCommandMenuProps {
  input: string;
  onSelect: (command: string) => void;
}

export const SlashCommandMenu = ({ input, onSelect }: SlashCommandMenuProps) => {
  const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);

  const slashQuery = useMemo(() => {
    if (!input.startsWith('/')) return '';
    return input.split(' ')[0].toLowerCase();
  }, [input]);

  const filteredCommands = useMemo(() => {
    if (!slashQuery) return [];
    return SLASH_COMMANDS.filter(cmd => cmd.command.startsWith(slashQuery));
  }, [slashQuery]);

  const showSlashMenu = slashQuery && filteredCommands.length > 0;

  useEffect(() => {
    if (showSlashMenu) {
      setSelectedSlashIdx(0);
    }
  }, [showSlashMenu]);

  const selectSlashCommand = (cmd: string) => {
    onSelect(cmd + ' ');
  };

  if (!showSlashMenu) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-full mb-2 left-0 w-full max-w-md bg-offline-surface-dark border border-offline-border rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] overflow-hidden z-50"
      >
        <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
          <Command size={10} className="text-offline-core/60" />
          <span className="text-[9px] font-mono text-offline-core/50 uppercase tracking-[0.2em]">Local_Commands</span>
        </div>
        {filteredCommands.map((cmd, idx) => (
          <button
            key={cmd.command}
            onMouseDown={() => selectSlashCommand(cmd.command)}
            className={`w-full text-left px-4 py-3 flex items-center gap-4 transition-all duration-150 border-l-2
              ${idx === selectedSlashIdx
                ? 'bg-offline-core/5 border-l-offline-core text-white'
                : 'border-l-transparent text-secondary-txt hover:bg-white/[0.03]'
              }`}
          >
            <span className="font-mono text-[13px] font-bold text-offline-core shrink-0">{cmd.command}</span>
            {cmd.args && <span className="font-mono text-[10px] text-tertiary-txt/60">{cmd.args}</span>}
            <span className="text-[11px] font-sans text-secondary-txt/60 ml-auto">{cmd.description}</span>
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
