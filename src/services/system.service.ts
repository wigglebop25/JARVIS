import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface SystemInfo {
  time: string;
  cpu_temperature: number | null;
  username: string;
  cpu_usage: number;
  ram_usage: number;
  disk_usage: number;
}

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

// ─── Centralized Telemetry Bus ──────────────────────────────────────────────
// Instead of each subscriber independently racing between real/simulated modes,
// we use a single shared bus that resolves the data source ONCE and broadcasts
// to all listeners through a simple pub/sub pattern.

type TelemetryCallback = (info: SystemInfo) => void;

let busInitialized = false;
let busListeners: TelemetryCallback[] = [];
let busCleanup: (() => void) | null = null;
let latestInfo: SystemInfo | null = null;
let telemetrySourceResolved = false;
let telemetryIsLive = false;

function broadcast(info: SystemInfo) {
  latestInfo = info;
  busListeners.forEach(cb => cb(info));
}

function initBus() {
  if (busInitialized) return;
  busInitialized = true;

  if (!isTauri()) {
    // Not in Tauri — no backend available, just return without setting up anything
    // The UI will show '--' / null values until real data arrives
    console.info('[SystemService] Non-Tauri environment detected. Telemetry will remain unavailable.');
    telemetrySourceResolved = true;
    telemetryIsLive = false;
    return;
  }

  // We're in Tauri — set up the real event listener
  let unlistenFn: UnlistenFn | null = null;

  const setup = async () => {
    try {
      unlistenFn = await listen<SystemInfo>('system-telemetry', (event) => {
        if (!telemetrySourceResolved) {
          telemetrySourceResolved = true;
          telemetryIsLive = true;
          console.info('[SystemService] Live telemetry stream established from backend.');
        }
        broadcast(event.payload);
      });

      busCleanup = () => {
        if (unlistenFn) unlistenFn();
      };
    } catch (err) {
      console.warn('[SystemService] system-telemetry listener setup failed:', err);
      telemetrySourceResolved = true;
      telemetryIsLive = false;
    }
  };

  setup();
}

/**
 * Fetches the initial system telemetry cached on the backend.
 * Crucial to prevent layout shifting/loading stubs on component mount.
 */
export async function getSystemInfo(): Promise<SystemInfo | null> {
  // Return cached data if we have it
  if (latestInfo) return latestInfo;

  if (!isTauri()) {
    return null;
  }

  try {
    const info = await invoke<SystemInfo>('get_system_info');
    latestInfo = info;
    return info;
  } catch (err) {
    console.warn('[SystemService] get_system_info invoke failed:', err);
    return null;
  }
}

/**
 * Subscribes to live system telemetry updates emitted by the backend worker.
 * Uses a centralized bus so the data source is resolved once, not per-subscriber.
 * @param callback Called every ~3 seconds with fresh system telemetry.
 */
export function onTelemetryReceived(
  callback: TelemetryCallback
): () => void {
  // Ensure the bus is initialized (idempotent)
  initBus();

  // Register the listener
  busListeners.push(callback);

  // If we already have data, deliver it immediately so new subscribers don't see '--'
  if (latestInfo) {
    callback(latestInfo);
  }

  // Return an unsubscribe function
  return () => {
    busListeners = busListeners.filter(cb => cb !== callback);
    // If no more listeners and we have a cleanup function, tear it down
    if (busListeners.length === 0 && busCleanup) {
      busCleanup();
      busCleanup = null;
      busInitialized = false;
      telemetrySourceResolved = false;
      latestInfo = null;
    }
  };
}

/**
 * Returns whether telemetry is coming from a live backend source.
 * Only meaningful after the first telemetry event has been received.
 */
export function isTelemetryLive(): boolean {
  return telemetryIsLive;
}
