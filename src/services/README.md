Purpose: The "Bridge" between the UI and the System.

Contents: hardwareService.ts for Bluetooth/WiFi/Volume toggles and mcpService.ts for sending commands to the AI Agent.

Rule: Never call invoke() or fetch() directly in a component; wrap them in a service function here.

Gamita useSystemData.tsx sa hooks folder para export sa data

src//
└── services/
    ├── mcp.service.ts      # Offline AI / Chat logic (Tauri Invoke)
    ├── system.service.ts   # Hardware metrics (CPU/RAM from Rust)
    ├── node.service.ts     # Local fleet/network discovery
    └── index.ts            # Central export for all offline logic