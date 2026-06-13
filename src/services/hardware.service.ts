import { invoke } from '@tauri-apps/api/core';

export interface VolumeInfo {
  level: number;
  muted: boolean;
  available: boolean;
}

export interface WifiInfo {
  enabled: boolean;
  available: boolean;
}

export interface BluetoothInfo {
  enabled: boolean;
  available: boolean;
}

export interface HardwareState {
  volume: VolumeInfo;
  wifi: WifiInfo;
  bluetooth: BluetoothInfo;
}

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

export async function getHardwareState(): Promise<HardwareState | null> {
  if (!isTauri()) return null;

  try {
    return await invoke<HardwareState>('get_hardware_state');
  } catch (err) {
    console.warn('[HardwareService] get_hardware_state invoke failed:', err);
    return null;
  }
}

export async function setSystemVolume(level: number): Promise<boolean> {
  if (!isTauri()) return false;

  const clamped = Math.max(0, Math.min(100, level));
  if (clamped !== level) {
    console.warn(`[HardwareService] Volume level ${level} clamped to ${clamped}`);
  }

  try {
    await invoke('set_system_volume', { level: clamped });
    return true;
  } catch (err) {
    console.warn('[HardwareService] set_system_volume invoke failed:', err);
    return false;
  }
}

export async function setVolumeMuted(muted: boolean): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    await invoke('set_volume_muted', { muted });
    return true;
  } catch (err) {
    console.warn('[HardwareService] set_volume_muted invoke failed:', err);
    return false;
  }
}

export async function setWifiEnabled(enabled: boolean): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    await invoke('set_wifi_enabled', { enabled });
    return true;
  } catch (err) {
    console.warn('[HardwareService] set_wifi_enabled invoke failed:', err);
    return false;
  }
}

export async function setBluetoothEnabled(enabled: boolean): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    await invoke('set_bluetooth_enabled', { enabled });
    return true;
  } catch (err) {
    console.warn('[HardwareService] set_bluetooth_enabled invoke failed:', err);
    return false;
  }
}
