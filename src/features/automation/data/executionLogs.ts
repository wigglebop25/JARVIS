export const EXECUTION_LOG_SEQUENCES: Record<string, string[]> = {
  Boot: [
    `[INIT] Booting Living Room Hub via WOL...`,
    `[INFO] Target MAC: 3C:A6:2F:88:B2:A1`,
    `[COMM] Sending Wake-On-LAN magic packet...`,
    `[PIND] Awaiting network response...`,
    `[PIND] Ping success (192.168.1.105): 4ms`,
    `[DONE] WOL Boot sequence complete.`
  ],
  Throttle: [
    `[INIT] CPU temperature threshold exceeded.`,
    `[DIAG] Main Server CPU Core: 87°C`,
    `[COMM] Dispatching fan duty cycle -> 100%`,
    `[PHYS] Fan speed sync: 4500 RPM`,
    `[DIAG] Core temp stabilized: 71°C`,
    `[DONE] Thermal throttle guard complete.`
  ],
  Lockdown: [
    `[WARN] EMERGENCY LOCKDOWN TRIGGERED!`,
    `[COMM] Halting non-essential telemetry...`,
    `[COMM] Revoking active SSH & API keys...`,
    `[PHYS] Enforcing software air-gap...`,
    `[DIAG] Status: All ports isolated.`,
    `[DONE] Air-gap lockdown sequence secure.`
  ],
  default: [
    `[INIT] Spawning process group for name`,
    `[INFO] Target node: target`,
    `[COMM] Handshake established. Running action...`,
    `[DIAG] Return code: 0x00 (SUCCESS)`,
    `[DONE] Task execution complete.`
  ]
};

export const getLogSequence = (name: string, target?: string): string[] => {
  const key = Object.keys(EXECUTION_LOG_SEQUENCES).find(k => name.includes(k)) || 'default';
  const seq = [...EXECUTION_LOG_SEQUENCES[key]];
  if (target && key === 'default') {
    seq[1] = `[INFO] Target node: ${target}`;
  }
  return seq;
};
