# UI Design Guide: Config TOML Settings

A comprehensive layout of all configuration options in `AppConfig`, outlining their purpose, recommended UI components, and sane ranges/default settings for the frontend.

## Configuration Parameters & UI Mapping

| Parameter Name               | Data Type         | Default Value                                             | Sane Range / Allowed Values                                   | Recommended UI Element                           | Description / Guidelines                                                                  |
| :--------------------------- | :---------------- | :-------------------------------------------------------- | :------------------------------------------------------------ | :----------------------------------------------- | :---------------------------------------------------------------------------------------- |
| **provider**                 | `Enum` / `String` | `"openai"`                                                | `"openai"`, `"gemini"`, `"anthropic"`                         | **Dropdown (Select)** or **Radio Button group**  | Active LLM neural endpoint. Dropdown is best for layout density.                          |
| **api_key**                  | `String`          | `""`                                                      | Any valid API key                                             | **Password Input** (with toggle hide/show)       | API credential for the selected provider. Keep masked by default.                         |
| **chat_model**               | `String`          | `"google/gemma-4-e4b"`                                    | Model identifiers (e.g. `gpt-4o`, `claude-3-5-sonnet-latest`) | **Combobox** (Text Input with autocomplete list) | Model ID. Autocomplete suggestions for typical defaults helps users.                      |
| **chat_base_url**            | `String`          | `"http://127.0.0.1:1234/v1"`                              | URL string                                                    | **Text Input**                                   | LLM API endpoint base path. Essential for local hosting (e.g. LMStudio, Ollama).          |
| **mcp_config_path**          | `String`          | `"mcp.json"`                                              | Valid relative/absolute file path                             | **Text Input** or **File Picker**                | Path to MCP tool server registrations. File picker button next to input is ideal.         |
| **vad_threshold**            | `f32` (Float)     | `0.5`                                                     | N/A                                                           | **None** (Removed from UI)                       | Deprecated/Removed from frontend settings interface. Still backed by DEFAULT_CONFIG.      |
| **silence_threshold_rms**    | `f32` (Float)     | `0.01`                                                    | `0.0` to `0.2` (typically `0.005` to `0.05`)                  | **Slider** (Step: `0.001`)                       | RMS audio energy threshold for silence. Adjusts ambient noise gate.                       |
| **silence_duration_ms**      | `u64` (Int)       | `1000`                                                    | `500` to `5000` ms (typically `800` to `2000`)                | **Slider** or **Number Input** (Step: `100`)     | Minimum duration of silence before stopping transcription recording automatically.        |
| **transcription_model_path** | `String`          | `"parakeet-tdt-0.6b-v3-int8"`                             | Local directory/folder name                                   | **Text Input**                                   | Folder name where local Whisper/Parakeet weight files reside.                             |
| **database_name**            | `String`          | `"jarvis.db"`                                             | Filename (e.g. `*.db`)                                        | **Text Input**                                   | Filename/path of SQLite database for history storage.                                     |
| **system_prompt**            | `String`          | `"You are JARVIS, a helpful AI assistant."`               | Raw multiline text                                            | **Textarea** (Multi-line Input)                  | Instructions defining the persona, constraints, and system context of the LLM.            |
| **compaction_prompt**        | `String`          | `"Summarize this context briefly, capturing key points."` | Raw multiline text                                            | **Textarea** (Multi-line Input)                  | Prompt sent to compaction model when history reaches context limits.                      |

---

## Suggested Settings Panel Layout

For a premium experience, structure the settings panel into logical tabs:

### 1. Model Configuration (`General` Tab)
* **Active Provider** (`provider`): Dropdown.
* **API Key** (`api_key`): Masked input (disabled if provider base URL points to a local endpoint like `sk-local`).
* **Chat Model** (`chat_model`): ComboBox with recommendations based on selected provider.
* **Base URL** (`chat_base_url`): URL input (pre-populated with default provider URLs if empty).

### 2. Audio & Voice Settings (`Voice` Tab)
* **Silence Energy Gate** (`silence_threshold_rms`): Slider from `0` to `0.1` (to filter background hum).
* **Auto-stop Silence Delay** (`silence_duration_ms`): Slider/Number input in milliseconds (e.g. `1000` ms is comfortable for natural pauses).
* **Voice Model** (`transcription_model_path`): Plain input.

### 3. Advanced Configurations (`System` Tab)
* **System Persona** (`system_prompt`): Textarea (allows resizing).
* **Compaction Instruction** (`compaction_prompt`): Textarea.
* **Database Name** (`database_name`): Text input.
* **MCP Config File** (`mcp_config_path`): File picker/text input.
