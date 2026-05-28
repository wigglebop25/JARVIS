# JARVIS — AGENTS.md

## Build & Run

- **Bun** is the canonical package manager (`bun.lock` committed). npm works but prefer bun.
- `bun run tauri dev` — full desktop app (Vite on port **1420**, strict; HMR on 1421 if remote).
- `bun run dev` — Vite frontend-only at `http://localhost:1420`.
- `bun run build` → `tsc && vite build` (**type-check at build time** — TS errors fail the build).
- `bun run tauri build` — production bundle (LTO, strip, codegen-units=1, opt-level=3, panic=unwind).
- Vite watcher **ignores** `src-tauri/**` (configured in `vite.config.ts`).
- **Rust**: run all cargo commands from `src-tauri/`. Crate is named `jarvis_lib` (avoids Windows binary collision with bin name `jarvis`).
  ```bash
  cargo check
  cargo test
  cargo clippy --all-targets --all-features -- -D warnings
  cargo fmt --all
  ```
- Prefix cargo/git commands with `rtk` (e.g. `rtk cargo check`) to filter output and save tokens.

## Frontend Architecture (`src/`)

- **`@/` path alias** resolves to `./src`. No relative imports across packages.
- **`src/components/`** — stateless, side-effect-free dumb components. Props + callbacks only.
- **`src/features/`** — one folder per domain capability. Each must have an `index.ts` as its public API. Export only what other packages need.
- **`src/store/`** — Zustand. Only use for state shared by **3+ unrelated components**; prefer local state or React context otherwise.
- **`src/services/`** — **only place** that calls `invoke()` from `@tauri-apps/api/core` or `fetch()`. Never call Tauri commands directly from components. Services also contain `localStorage` mock fallbacks for browser-only dev (check `window.__TAURI_INTERNALS__`).
- **`src/context/`** — React context for Theme, Voice, Session.
- **`src/hooks/`** — data-fetching hooks (`useChat`, `useVoice`, `useSystemData`, etc.).
- **Routing**: React Router v7. Two branches: offline (`OfflineMainLayout` → `OfflineDashboardPage`) and online (`MainLayout` → Dashboard/DeviceManagement/Automation). Mode stored in `sessionStorage['jarvis_mode']`.
- **TypeScript**: strict mode, `noUnusedLocals`, `noUnusedParameters`. No dedicated JS/TS linter configured.
- **Tailwind CSS v4**: **no `tailwind.config.js`**. Theme tokens, animations, and custom colors in `@theme` directive inside `src/styles.css`. Dynamic themes via CSS variables (`--theme-accent`, `--theme-bg-base`, etc.). Theme classes: `theme-jarvis`, `theme-cyberpunk`, `theme-amber`.

## Backend Architecture (`src-tauri/`)

Clean Architecture / DDD layout:
| Directory | Role |
|---|---|
| `commands/` | Tauri command handlers (controllers) exposed to frontend |
| `domain/` | Pure data structures — AppConfig, DB config, errors, system telemetry structs, voice state. No side effects. |
| `handlers/` | Background async workers — voice listener loop, transcription |
| `infrastructure/` | Boundary concerns — SQLite manager (`rusqlite` bundled), repository pattern, system telemetry collector |

- **Tauri plugins**: `tauri-plugin-opener`, `tauri-plugin-dialog`, `tauri-plugin-media`.
- AI deps: `agent_rs` (git dep), `rig-core 0.36`.
- Voice: `jarvis-transcriber` (git dep, Parakeet model).
- Startup wiring in `lib.rs`: loads `config.toml` from app config dir, initializes SQLite, voice state, and system telemetry background worker.

## No CI/CD, no ESLint/Prettier

No GitHub Actions workflows, no ESLint, no Prettier config. Rust linting is Clippy-only. JS/TS quality relies on `tsc` and manual discipline.
