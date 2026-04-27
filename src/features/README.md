Purpose: Domain-driven logic organized by JARVIS capabilities.

Sub-folders:
    automation/: Logic for routine builders.
    devices/: Linking logic and Wake on LAN (WOL) implementation.
    nodes/: Management of remote JARVIS nodes.

Rule: Each feature must have an index.ts (Public API) to export only what is necessary to the rest of the app.