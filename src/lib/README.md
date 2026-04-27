Purpose: Configuration for external SDKs and libraries.

Contents: axios.ts for the Axum REST API, socket.ts for WebSocket initialization, and tauri.ts for the Rust-to-Frontend bridge.

Rule: This is the only place where global library instances should be configured.