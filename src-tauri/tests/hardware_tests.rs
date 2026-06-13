use jarvis_lib::domain::hardware::{BluetoothInfo, HardwareState, VolumeInfo, WifiInfo};

fn sample_state() -> HardwareState {
    HardwareState {
        volume: VolumeInfo {
            level: 75,
            muted: true,
            available: true,
        },
        wifi: WifiInfo {
            enabled: true,
            available: true,
        },
        bluetooth: BluetoothInfo {
            enabled: false,
            available: true,
        },
    }
}

#[test]
fn hardware_state_serialization_roundtrip() {
    let state = sample_state();
    let json = serde_json::to_string(&state).unwrap();
    let deserialized: HardwareState = serde_json::from_str(&json).unwrap();
    assert_eq!(state.volume.level, deserialized.volume.level);
    assert_eq!(state.volume.muted, deserialized.volume.muted);
    assert_eq!(state.volume.available, deserialized.volume.available);
    assert_eq!(state.wifi.enabled, deserialized.wifi.enabled);
    assert_eq!(state.wifi.available, deserialized.wifi.available);
    assert_eq!(state.bluetooth.enabled, deserialized.bluetooth.enabled);
    assert_eq!(state.bluetooth.available, deserialized.bluetooth.available);
}

#[test]
fn unavailable_state_construction() {
    let state = HardwareState {
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
    };
    assert!(!state.volume.available);
    assert_eq!(state.volume.level, 0);
    assert!(!state.volume.muted);
    assert!(!state.wifi.available);
    assert!(!state.wifi.enabled);
    assert!(!state.bluetooth.available);
    assert!(!state.bluetooth.enabled);
}

#[test]
fn camel_case_field_names() {
    let state = sample_state();
    let value = serde_json::to_value(&state).unwrap();
    let obj = value.as_object().unwrap();

    assert!(obj.contains_key("volume"));
    assert!(obj.contains_key("wifi"));
    assert!(obj.contains_key("bluetooth"));

    let vol = obj["volume"].as_object().unwrap();
    assert!(vol.contains_key("level"));
    assert!(vol.contains_key("muted"));
    assert!(vol.contains_key("available"));

    let wifi = obj["wifi"].as_object().unwrap();
    assert!(wifi.contains_key("enabled"));
    assert!(wifi.contains_key("available"));

    let bt = obj["bluetooth"].as_object().unwrap();
    assert!(bt.contains_key("enabled"));
    assert!(bt.contains_key("available"));
}
