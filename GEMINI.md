# JARVIS Development Reference (GEMINI.md)

This file contains build, run, and test commands, project guidelines, and coding standards for JARVIS.

---

## Build and Run Commands

### Frontend & Tauri Development
JARVIS is a **Tauri v2** desktop application with a **React (Vite + TypeScript)** frontend. **Bun** is the primary package manager for dependency lock management.

* **Run Tauri Desktop App in Development Mode**:
  ```bash
  bun run tauri dev
  # or
  npm run tauri dev
  ```
* **Run only the Vite frontend dev server** (runs on port `1420` by default):
  ```bash
  bun run dev
  # or
  npm run dev
  ```
* **Build Tauri Production Desktop Application**:
  ```bash
  bun run tauri build
  # or
  npm run tauri build
  ```
* **Build only Vite frontend static assets**:
  ```bash
  bun run build
  # or
  npm run build
  ```

### Rust Backend (`src-tauri`)
All Rust-specific tasks should be run from within the `src-tauri` directory. You can prefix these commands with `rtk` (e.g., `rtk cargo check`) to filter output and optimize token consumption.
* **Check Rust compilation**:
  ```bash
  cargo check
  # or optimized
  rtk cargo check
  ```
* **Run backend unit and integration tests**:
  ```bash
  cargo test
  # or optimized
  rtk cargo test
  ```
* **Run Rust linter (Clippy)**:
  ```bash
  cargo clippy --all-targets --all-features -- -D warnings
  # or optimized
  rtk cargo clippy --all-targets --all-features -- -D warnings
  ```
* **Run Rust code formatter**:
  ```bash
  cargo fmt --all
  # or optimized
  rtk cargo fmt --all
  ```

### Rust Token Killer (RTK) Proxying
All git and developer commands are proxied/wrapped through `rtk` via hook-based usage (e.g. `git status` -> `rtk git status`).
* **Show token savings analytics**:
  ```bash
  rtk gain
  ```
* **Show command history with token savings details**:
  ```bash
  rtk gain --history
  ```
* **Analyze Claude/Gemini CLI history for missed opportunities**:
  ```bash
  rtk discover
  ```
* **Execute raw command directly without filter (for debugging)**:
  ```bash
  rtk proxy <command>
  ```

---

## Code Quality & Architecture Guidelines

### Frontend Architecture (`src/`)
* **Path Aliasing**: Always use the `@/` path alias (which resolves to `./src`) when importing project modules. Do not use relative imports (e.g. `../../components`).
  * *Example*: `import { MainLayout } from '@/layouts/MainLayout';`
* **Component Discipline (`src/components/`)**:
  * Components under this folder must be **"dumb"** and **stateless/side-effect free**.
  * They must receive data via `props` and notify parent components of actions via callbacks (events).
* **Feature Scope (`src/features/`)**:
  * Domain logic is separated by capability (e.g. `automation/`, `devices/`, `nodes/`, `mcp/`).
  * **Rule**: Each feature folder must have an `index.ts` acting as its **Public API**. Only export what is absolutely necessary to the rest of the application.
* **State Management (`src/store/`)**:
  * Use **Zustand** stores for global state (e.g., active nodes, active user, music metadata).
  * **Rule**: Only store data in the global store if it needs to be accessed by **three or more unrelated components**. Otherwise, use local state or React context.
* **Services (`src/services/`)**:
  * The service layer acts as the bridge between React UI components and Tauri commands or REST APIs.
  * **Rule**: **Never** call Tauri `invoke()` or `fetch()` directly in a component. Always wrap them in a service function in `src/services/` (e.g., `chatService.ts`, `system.service.ts`, `voiceService.ts`).
  * Use the hook `useSystemData.tsx` to stream telemetry.

### Styling System (Tailwind CSS v4)
* **Tailwind v4 Theme Configuration**: We do not use a `tailwind.config.js` file. All theme configurations, animations, and custom colors are defined inside the `@theme` directive in [src/styles.css](src/styles.css).
* **Theme Mapping**: We support dynamic skins/themes (`theme-jarvis`, `theme-cyberpunk`, `theme-amber`). Always use the semantic theme variables:
  * Accent neon/glow: `var(--theme-accent)` (Mapped in CSS tailwind config as `bg-theme-accent`, `text-theme-accent`, etc.)
  * Background: `var(--theme-bg-base)`
  * Surfaces: `var(--theme-surface-1)`, `var(--theme-surface-2)`
  * Borders: `var(--theme-border)`, `var(--theme-border-hover)`
* **Typography**:
  * Sans-serif: Inter (`var(--font-sans)`)
  * Monospace: JetBrains Mono (`var(--font-mono)`)
* **Overlay Utilities**:
  * Grid overlay: `.grid-overlay`
  * Scanline animation overlay: `.scanline-overlay`
  * Glass panels: `.mcp-glass-panel` (12px blur, custom borders)

### Backend Architecture (`src-tauri/`)
We follow **Clean Architecture / Domain-Driven Design (DDD)**:
* **`domain/`**: Houses app configurations (`AppConfig`), database configurations (`db.rs`), errors (`errors.rs`), system telemetry data (`system.rs`), and voice listening states (`voice.rs`). Keep this package free of side-effects.
* **`infrastructure/`**: Handles boundary Concerns: SQLite manager (`db.rs`), repository data access layer (`repository.rs`), system telemetry metrics (`system.rs`), and AI agents.
* **`commands/`**: Contains Tauri command handlers (controllers) exposed directly to the React frontend.
* **`handlers/`**: Asynchronous system daemon handlers and worker routines (like voice listener loop initializing).
* **Tauri Setup**: SQLite connections, voice listeners, configuration file parsing, and system telemetry background worker threads are initialized in [lib.rs](src-tauri/src/lib.rs).
