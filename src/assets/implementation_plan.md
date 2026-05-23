# Connecting Tauri Backend Commands to the Frontend

This implementation plan outlines the steps required to hook up the backend Tauri commands (for configuration, database-backed chat sessions, system stats, and MCP skills) to the React/TypeScript frontend. It addresses both online and offline (local) dashboard modes and implements graceful, defensive fallback strategies for backend endpoints that are currently work-in-progress stubs.

## User Review Required

> [!WARNING]
> **Config Schema Deserialization**: The backend config is written in Rust (`config.toml` via `AppConfig` struct). We must ensure the keys in `AppConfig` in `configService.ts` exactly match the serializable field names in the Rust `AppConfig` struct (specifically snake_case vs camelCase).
>
> **Missing/Empty Session IDs**: The backend `prompt` command requires a `session_id`. We need to dynamically initialize a session ID on the frontend using `create_session` before sending the first prompt, otherwise prompt submissions will fail.

## Open Questions

> [!IMPORTANT]
> **Session History UI Design**: Do you want a sidebar list to switch between older chat sessions (as supported by `list_sessions`), or should we just manage a single active session in the background for now to keep the console clean? (The proposed plan includes support for multiple sessions to showcase the backend's capability, but it can be restricted if preferred).

---

## Proposed Changes

### Configuration Services

#### [MODIFY] [configService.ts](file:///f:/Jarvis2/JARVIS/src/services/configService.ts)
* Replace the `sessionStorage` logic inside `getConfig()` and `saveConfig()` with real Tauri `invoke()` calls to `get_config` and `update_config`.
* Ensure proper key casing translations if needed between TypeScript (`camelCase`) and Rust (`snake_case`).

---

### Chat & Sessions Services

#### [MODIFY] [chatService.ts](file:///f:/Jarvis2/JARVIS/src/services/chatService.ts)
* Expand the file to include wrapper functions invoking:
  * `create_session(title?: string) -> Promise<string>`
  * `list_sessions() -> Promise<Session[]>`
  * `get_history(sessionId: string) -> Promise<RigMessage[]>`
* Modify `sendPrompt` to accept a mandatory `sessionId` parameter, matching the backend signature:
  `invoke<ChatResponse>("prompt", { sessionId, input })`.

#### [MODIFY] [tauri.ts](file:///f:/Jarvis2/JARVIS/src/types/tauri.ts)
* Add TS interface definitions for backend-returned structures:
  * `Session` (fields: `id`, `title`, `created_at`, `updated_at`)
  * `RigMessage` (fields: `role`, `content`)

#### [MODIFY] [useChat.ts](file:///f:/Jarvis2/JARVIS/src/hooks/useChat.ts)
* Introduce `activeSessionId` state.
* On mount, fetch active sessions via `listSessions()`. If none exist, call `createSession()` to initialize one.
* Update `sendMessage` to pass the `activeSessionId` when calling `sendPrompt()`.
* Add logic to load conversation history when the active session changes (using `getHistory()`), mapping the RigMessage format defensively to the frontend message logs.

---

### Dashboard & Offline Mode

#### [MODIFY] [OfflineDashboardPage.tsx](file:///f:/Jarvis2/JARVIS/src/pages/OfflineDashboardPage.tsx)
* Instead of using purely front-end mock replies (`getRandomMcpResponse()`), hook this up to call the backend chat service.
* In local/offline mode, the backend automatically uses the configured local model provider (e.g. LMStudio/Ollama), so calling `sendPrompt` with the session ID will pull the real offline model responses.

#### [MODIFY] [useSystemData.tsx](file:///f:/Jarvis2/JARVIS/src/hooks/useSystemData.tsx)
* Attempt to fetch hardware statistics using `invoke("get_device_info")`.
* **Defensive Fallback**: If the invocation fails (as `get_device_info` is currently a work-in-progress stub in Rust), intercept the error (`NotAvailable`) and fallback to the simulated `MOCK_DEVICES` loop. This guarantees that the UI stays fully operational and won't crash when running incomplete modules.

---

## Verification Plan

### Automated & Manual Verification
* Run `npm run dev` and open the app.
* Verify settings load from and write successfully to `config.toml` (confirm values persist across app reloads).
* Verify chat prompt can be sent in both online and offline mode without throwing deserialization errors.
* Verify session creation is registered in the Tauri console logs.
* Verify system statistics still work and gracefully fall back to simulation when backend stubs are not yet fully implemented.
