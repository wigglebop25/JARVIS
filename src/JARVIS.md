### JARVIS: An AI Enabled Home and Desktop Assistant
### Architecture Overview

### Tech Stack
- **Languages:** TypeScript, Rust, Python
- **Build System:** Maturin, Nodejs, Cargo 
- **Frontend:** TypeScript (React + Tauri)
- **REST API:**
	- Axum
	- Diesel-Async
	- Argon2 password hashing
	- Websockets for real time update
- **Database:**  PostgreSQL, RocksDB (Key value store)
- **Authentication:** API Key Auth on connecting devices. JWT with refresh tokens on REST API
### Features (Frontend Dashboard): 
- Device linking
- Add automation routines
- Number of devices online and offline
- Ability to wake devices (Wake on LAN)
### Code Architecture
Microservice:
- Services:
	- MCP(Rust)
	- Frontend Web Dashboard (React)
	- Master Server to interact with Nodes
	- Node
### System Components
- **MCP Server:** To allow AI Agents to interact with the application 
- **User Interface:** Web Dashboard for controlling the background service
- Hardware interactions written in Rust
### Hardware Capabilities for Master Server
- Plays music through spotify (through spotify mcp)
- Set system volume
- Screen recording (through obs-cmd)
- Ability to turn on hardware settings such as bluetooth or wifi
- File organization (Scoped through directories only)
- Translate text on screen
### Data Flow
1. Local Interaction: User commands the app through a wake word which will then be performed by the AI through an MCP. Commands are varied
2. Remote Interaction: Remote clients can interact with the system through the REST API
3. Adding additional Nodes: Install the application and configure as a node 
Command Flow:
Porcupine -> Whisper Transcribe -> Copilot SDK with skills -> Local MCP -> Hardware Interaction
### Rationale
- Using Rust would make sure that the app would provide great performance
- Maturin would allow interoperability with Rust through PyO3