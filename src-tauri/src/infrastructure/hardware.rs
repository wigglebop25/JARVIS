use crate::domain::errors::AppError;
use crate::domain::hardware::{BluetoothInfo, HardwareState, VolumeInfo, WifiInfo};

// ---------------------------------------------------------------------------
// Public API (platform-agnostic)
// ---------------------------------------------------------------------------

pub async fn get_hardware_state() -> Result<HardwareState, AppError> {
    tokio::task::spawn_blocking(|| {
        #[cfg(target_os = "windows")]
        {
            windows_impl::get_hardware_state()
        }
        #[cfg(target_os = "linux")]
        {
            linux_impl::get_hardware_state()
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            Ok(HardwareState {
                volume: VolumeInfo {
                    level: 0,
                    muted: false,
                    available: false,
                },
                wifi: WifiInfo {
                    enabled: false,
                    available: false,
                },
                bluetooth: BluetoothInfo {
                    enabled: false,
                    available: false,
                },
            })
        }
    })
    .await
    .map_err(|e| AppError::SystemError(format!("spawn blocking: {e}")))?
}

pub async fn set_system_volume(level: u8) -> Result<(), AppError> {
    tokio::task::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            windows_impl::set_system_volume(level)
        }
        #[cfg(target_os = "linux")]
        {
            linux_impl::set_system_volume(level)
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            Err(AppError::NotAvailable("platform not supported".into()))
        }
    })
    .await
    .map_err(|e| AppError::SystemError(format!("spawn blocking: {e}")))?
}

pub async fn set_volume_muted(muted: bool) -> Result<(), AppError> {
    tokio::task::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            windows_impl::set_volume_muted(muted)
        }
        #[cfg(target_os = "linux")]
        {
            linux_impl::set_volume_muted(muted)
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            Err(AppError::NotAvailable("platform not supported".into()))
        }
    })
    .await
    .map_err(|e| AppError::SystemError(format!("spawn blocking: {e}")))?
}

pub async fn set_wifi_enabled(enabled: bool) -> Result<(), AppError> {
    tokio::task::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            windows_impl::set_wifi_enabled(enabled)
        }
        #[cfg(target_os = "linux")]
        {
            linux_impl::set_wifi_enabled(enabled)
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            Err(AppError::NotAvailable("platform not supported".into()))
        }
    })
    .await
    .map_err(|e| AppError::SystemError(format!("spawn blocking: {e}")))?
}

pub async fn set_bluetooth_enabled(enabled: bool) -> Result<(), AppError> {
    tokio::task::spawn_blocking(move || {
        #[cfg(target_os = "windows")]
        {
            windows_impl::set_bluetooth_enabled(enabled)
        }
        #[cfg(target_os = "linux")]
        {
            linux_impl::set_bluetooth_enabled(enabled)
        }
        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        {
            Err(AppError::NotAvailable("platform not supported".into()))
        }
    })
    .await
    .map_err(|e| AppError::SystemError(format!("spawn blocking: {e}")))?
}

// ---------------------------------------------------------------------------
// Windows implementation
// ---------------------------------------------------------------------------

#[cfg(target_os = "windows")]
mod windows_impl {
    use super::*;

    use std::os::windows::process::CommandExt;
    use windows::core::{GUID, HRESULT};
    use windows::Win32::Foundation::HANDLE;
    use windows::Win32::Media::Audio::Endpoints::IAudioEndpointVolume;
    use windows::Win32::Media::Audio::{eMultimedia, eRender, IMMDeviceEnumerator};
    use windows::Win32::NetworkManagement::WiFi::{
        wlan_intf_opcode_radio_state, WlanCloseHandle, WlanEnumInterfaces, WlanFreeMemory,
        WlanOpenHandle, WlanQueryInterface, WlanSetInterface, WLAN_INTERFACE_INFO_LIST,
    };
    use windows::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED,
    };

    /// Convert a Win32 error code (DWORD) into an `AppError` if non-zero.
    /// ERROR_SUCCESS = 0 means success; anything else is a failure.
    fn wlan_err(code: u32, op: &str) -> Result<(), AppError> {
        if code == 0 {
            Ok(())
        } else {
            Err(AppError::SystemError(format!("{op}: error code {code}")))
        }
    }

    // CLSID for MMDeviceEnumerator: {BCDE0395-E52F-467C-8E3D-C4579291692E}
    const CLSID_MMDEVICE_ENUMERATOR: GUID = GUID::from_values(
        0xBCDE0395,
        0xE52F,
        0x467C,
        [0x8E, 0x3D, 0xC4, 0x57, 0x92, 0x91, 0x69, 0x2E],
    );

    /// Initialize COM and return an audio endpoint volume interface.
    fn audio_endpoint_volume() -> Result<IAudioEndpointVolume, AppError> {
        unsafe {
            let hr = CoInitializeEx(None, COINIT_MULTITHREADED);
            match hr {
                HRESULT(0) | HRESULT(1) => {}
                h if h.0 == 0x80010106_u32 as i32 => {
                    return Err(AppError::SystemError("COM threading mode conflict".into()))
                }
                _ => return Err(AppError::SystemError(format!("CoInitializeEx: {hr}"))),
            }

            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&CLSID_MMDEVICE_ENUMERATOR, None, CLSCTX_ALL)
                    .map_err(|e| AppError::SystemError(format!("CoCreateInstance: {e}")))?;

            let device = enumerator
                .GetDefaultAudioEndpoint(eRender, eMultimedia)
                .map_err(|e| AppError::SystemError(format!("GetDefaultAudioEndpoint: {e}")))?;

            let volume: IAudioEndpointVolume = device
                .Activate(CLSCTX_ALL, None)
                .map_err(|e| AppError::SystemError(format!("Activate: {e}")))?;

            Ok(volume)
        }
    }

    fn get_volume_raw() -> Result<(u8, bool), AppError> {
        let volume = audio_endpoint_volume()?;
        unsafe {
            let scalar = volume
                .GetMasterVolumeLevelScalar()
                .map_err(|e| AppError::SystemError(format!("GetMasterVolumeLevelScalar: {e}")))?;
            let level = (scalar * 100.0).round() as u8;

            let muted = volume
                .GetMute()
                .map_err(|e| AppError::SystemError(format!("GetMute: {e}")))?;

            Ok((level, muted.0 != 0))
        }
    }

    pub fn get_hardware_state() -> Result<HardwareState, AppError> {
        let (volume_level, volume_muted, volume_available) = match get_volume_raw() {
            Ok((level, muted)) => (level, muted, true),
            Err(_) => (0, false, false),
        };

        let (wifi_enabled, wifi_available) = match get_wifi_radio_state() {
            Ok(enabled) => (enabled, true),
            Err(_) => (false, false),
        };

        let (bt_enabled, bt_available) = match get_bluetooth_radio_state() {
            Ok(enabled) => (enabled, true),
            Err(_) => (false, false),
        };

        Ok(HardwareState {
            volume: VolumeInfo {
                level: volume_level,
                muted: volume_muted,
                available: volume_available,
            },
            wifi: WifiInfo {
                enabled: wifi_enabled,
                available: wifi_available,
            },
            bluetooth: BluetoothInfo {
                enabled: bt_enabled,
                available: bt_available,
            },
        })
    }

    pub fn set_system_volume(level: u8) -> Result<(), AppError> {
        let volume = audio_endpoint_volume()?;
        unsafe {
            volume
                .SetMasterVolumeLevelScalar(level as f32 / 100.0, std::ptr::null())
                .map_err(|e| AppError::SystemError(format!("SetMasterVolumeLevelScalar: {e}")))?;
        }
        Ok(())
    }

    pub fn set_volume_muted(muted: bool) -> Result<(), AppError> {
        let volume = audio_endpoint_volume()?;
        unsafe {
            volume
                .SetMute(muted, std::ptr::null())
                .map_err(|e| AppError::SystemError(format!("SetMute: {e}")))?;
        }
        Ok(())
    }

    // ----- radios (wifi / bluetooth) -----
    // Uses Win32 WlanAPI for Wi-Fi and PowerShell PnP for Bluetooth, because the
    // UWP `Windows.Devices.Radios` API requires a packaged MSIX app context (Tauri
    // dev is unpackaged Win32 → UWP returns an empty radio list → "radio not found").
    // Win32 has no Bluetooth radio on/off API either; PnP `Enable/Disable-PnpDevice`
    // is the canonical mechanism (requires admin on most systems).

    /// Open a WlanAPI client handle. Caller must call `WlanCloseHandle`.
    fn open_wlan_client() -> Result<HANDLE, AppError> {
        unsafe {
            let mut client_handle = HANDLE::default();
            let mut negotiated_version = 0u32;
            wlan_err(
                WlanOpenHandle(2, None, &mut negotiated_version, &mut client_handle),
                "WlanOpenHandle",
            )?;
            Ok(client_handle)
        }
    }

    /// Get the GUID of the first Wi-Fi interface, or `Err` if none.
    fn first_wifi_interface_guid(client_handle: HANDLE) -> Result<GUID, AppError> {
        unsafe {
            let mut interface_list_ptr = std::ptr::null_mut();
            wlan_err(
                WlanEnumInterfaces(client_handle, None, &mut interface_list_ptr),
                "WlanEnumInterfaces",
            )?;

            if interface_list_ptr.is_null() {
                return Err(AppError::NotAvailable("no Wi-Fi interface".into()));
            }

            let result = (|| -> Result<GUID, AppError> {
                let list = &*(interface_list_ptr as *const WLAN_INTERFACE_INFO_LIST);
                let count = list.dwNumberOfItems as usize;
                if count == 0 {
                    return Err(AppError::NotAvailable("no Wi-Fi interface".into()));
                }
                let interfaces = std::slice::from_raw_parts(list.InterfaceInfo.as_ptr(), count);
                Ok(interfaces[0].InterfaceGuid)
            })();

            WlanFreeMemory(interface_list_ptr as *const _);
            result
        }
    }

    fn get_wifi_radio_state() -> Result<bool, AppError> {
        unsafe {
            let client_handle = open_wlan_client()?;
            let result = (|| -> Result<bool, AppError> {
                let guid = first_wifi_interface_guid(client_handle)?;
                let mut data_size: u32 = 0;
                let mut data: *mut std::ffi::c_void = std::ptr::null_mut();

                wlan_err(
                    WlanQueryInterface(
                        client_handle,
                        &guid,
                        wlan_intf_opcode_radio_state,
                        None,
                        &mut data_size,
                        &mut data,
                        None,
                    ),
                    "WlanQueryInterface",
                )?;

                let on = *(data as *const u32) != 0;
                WlanFreeMemory(data as *const _);
                Ok(on)
            })();
            let _ = WlanCloseHandle(client_handle, None);
            result
        }
    }

    fn set_wifi_radio_state(enabled: bool) -> Result<(), AppError> {
        unsafe {
            let client_handle = open_wlan_client()?;
            let result = (|| -> Result<(), AppError> {
                let guid = first_wifi_interface_guid(client_handle)?;
                let new_state: u32 = if enabled { 1 } else { 0 };
                wlan_err(
                    WlanSetInterface(
                        client_handle,
                        &guid,
                        wlan_intf_opcode_radio_state,
                        std::mem::size_of::<u32>() as u32,
                        &new_state as *const u32 as *const std::ffi::c_void,
                        None,
                    ),
                    "WlanSetInterface",
                )?;
                Ok(())
            })();
            let _ = WlanCloseHandle(client_handle, None);
            result
        }
    }

    // ----- Bluetooth via PowerShell PnP cmdlets -----

    /// Find the Bluetooth radio's PnP InstanceId. Filters out enumerated
    /// devices (BTHENUM\) and only matches the actual radio on USB\ or PCI\.
    fn find_bluetooth_radio_instance_id() -> Result<String, AppError> {
        let output = std::process::Command::new("powershell")
            .creation_flags(0x08000000)
            .args([
                "-NoProfile",
                "-Command",
                "Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | \
                 Where-Object { $_.InstanceId -match '^(USB|PCI)\\\\' } | \
                 Select-Object -First 1 -ExpandProperty InstanceId",
            ])
            .output()
            .map_err(|e| AppError::SystemError(format!("powershell: {e}")))?;

        if !output.status.success() {
            return Err(AppError::SystemError(format!(
                "Get-PnpDevice failed: {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }

        let instance_id = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if instance_id.is_empty() {
            Err(AppError::NotAvailable("no Bluetooth radio".into()))
        } else {
            Ok(instance_id)
        }
    }

    fn get_bluetooth_radio_state() -> Result<bool, AppError> {
        let output = std::process::Command::new("powershell")
            .creation_flags(0x08000000)
            .args([
                "-NoProfile",
                "-Command",
                "Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | \
                 Where-Object { $_.InstanceId -match '^(USB|PCI)\\\\' } | \
                 Select-Object -First 1 -ExpandProperty Status",
            ])
            .output()
            .map_err(|e| AppError::SystemError(format!("powershell: {e}")))?;

        if !output.status.success() {
            return Err(AppError::SystemError(format!(
                "Get-PnpDevice failed: {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }

        let status = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if status.is_empty() {
            Err(AppError::NotAvailable("no Bluetooth radio".into()))
        } else {
            Ok(status == "OK")
        }
    }

    fn set_bluetooth_radio_state(enabled: bool) -> Result<(), AppError> {
        let instance_id = find_bluetooth_radio_instance_id()?;
        let verb = if enabled { "Enable" } else { "Disable" };

        let output = std::process::Command::new("powershell")
            .creation_flags(0x08000000)
            .args([
                "-NoProfile",
                "-Command",
                &format!("{verb}-PnpDevice -InstanceId '{instance_id}' -Confirm:$false"),
            ])
            .output()
            .map_err(|e| AppError::SystemError(format!("powershell: {e}")))?;

        if !output.status.success() {
            return Err(AppError::SystemError(format!(
                "{verb}-PnpDevice failed (likely requires admin): {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }
        Ok(())
    }

    pub fn set_wifi_enabled(enabled: bool) -> Result<(), AppError> {
        set_wifi_radio_state(enabled)
    }

    pub fn set_bluetooth_enabled(enabled: bool) -> Result<(), AppError> {
        set_bluetooth_radio_state(enabled)
    }
}

// ---------------------------------------------------------------------------
// Linux implementation (stubs — full alsa + zbus impl deferred)
// ---------------------------------------------------------------------------

#[cfg(target_os = "linux")]
mod linux_impl {
    use super::*;

    pub fn get_hardware_state() -> Result<HardwareState, AppError> {
        Ok(HardwareState {
            volume: VolumeInfo {
                level: 0,
                muted: false,
                available: false,
            },
            wifi: WifiInfo {
                enabled: false,
                available: false,
            },
            bluetooth: BluetoothInfo {
                enabled: false,
                available: false,
            },
        })
    }

    pub fn set_system_volume(_level: u8) -> Result<(), AppError> {
        Ok(())
    }

    pub fn set_volume_muted(_muted: bool) -> Result<(), AppError> {
        Ok(())
    }

    pub fn set_wifi_enabled(_enabled: bool) -> Result<(), AppError> {
        Ok(())
    }

    pub fn set_bluetooth_enabled(_enabled: bool) -> Result<(), AppError> {
        Ok(())
    }
}
