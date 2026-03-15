src/
├── assets/          # JARVIS branding, icons, and UI sounds
├── components/      # Global, "Dumb" UI (Gauges, Cards, Toggles)
├── features/        # Feature-based logic (Organized by domain)
│   ├── automation/  # Routine builders and scheduling logic
│   ├── devices/     # Linking, status, and Wake on LAN (WOL)
│   └── nodes/       # Node fleet monitoring and health checks
├── hooks/           # useWebSocket, useHardwareStatus, useAuth
├── layouts/         # DashboardLayout (Titlebar, Sidebar, Notifications)
├── lib/             # Third-party configs (Axios for REST, WS Client)
├── pages/           # Thin Route Views (Dashboard, Automations)
├── services/        # The "Bridge" (Calls Axum REST or Tauri/Rust)
├── store/           # Global State (Active Nodes, AI Context)
├── utils/           # formatBytes, validateCommand, colorHelpers
└── types/           # TS Interfaces for Nodes, Devices, and MCP schemas