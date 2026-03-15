Purpose: The "Bridge" between the UI and the System.

Contents: hardwareService.ts for Bluetooth/WiFi/Volume toggles and mcpService.ts for sending commands to the AI Agent.

Rule: Never call invoke() or fetch() directly in a component; wrap them in a service function here.