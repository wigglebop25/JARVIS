import { invoke, Channel } from "@tauri-apps/api/core";
import { ChatResponse, Session, RigMessage, TokenCountResponse } from "@/types/tauri";

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

// Simulated mock responses for web browser testing
// const MOCK_ANSWERS = [
//   "Core uplink established. All diagnostics report nominal status.",
//   "Understood. Initiating telemetry sweeps on connected nodes...",
//   "Acknowledged. Routing command through active gateway.",
//   "Grid sync protocols established. Waiting for additional instructions.",
//   "Diagnostics complete. Thermal output is within optimal thresholds (34°C).",
// ];

// ─── LocalStorage Mocks for Browser/Web Sandbox ─────────────────────────────
const MOCK_SESSIONS_KEY = "jarvis_mock_sessions";
const MOCK_HISTORY_KEY_PREFIX = "jarvis_mock_history_";

const getMockSessions = (): Session[] => {
  const data = localStorage.getItem(MOCK_SESSIONS_KEY);
  if (!data) {
    const defaultSessions: Session[] = [
      { id: "session-1", title: "Simulation Session", created_at: Date.now(), updated_at: Date.now() }
    ];
    localStorage.setItem(MOCK_SESSIONS_KEY, JSON.stringify(defaultSessions));
    return defaultSessions;
  }
  return JSON.parse(data);
};

const saveMockSessions = (sessions: Session[]) => {
  localStorage.setItem(MOCK_SESSIONS_KEY, JSON.stringify(sessions));
};

const getMockHistory = (sessionId: string): RigMessage[] => {
  const data = localStorage.getItem(MOCK_HISTORY_KEY_PREFIX + sessionId);
  return data ? JSON.parse(data) : [];
};

const saveMockHistory = (sessionId: string, history: RigMessage[]) => {
  localStorage.setItem(MOCK_HISTORY_KEY_PREFIX + sessionId, JSON.stringify(history));
};

// ─── Chat Prompt ────────────────────────────────────────────────────────────

export const sendPrompt = async (
  sessionId: string, 
  input: string, 
  attachments?: string[] // Array of absolute file paths
): Promise<ChatResponse> => {
  if (!isTauri()) {
    console.info("[chatService] Non-Tauri environment, using local storage mock.");
    await new Promise(r => setTimeout(r, 600)); // Simulate thinking latency
    
    let reply = `[SIMULATOR] Core uplink established. I have received your prompt.`;
    if (attachments && attachments.length > 0) {
      reply = `[SIMULATOR] I noticed the following attached file path(s): ${attachments.join(", ")}. In a Tauri environment, the agent will read these paths using its ReadDocumentTool.`;
    }

    // Append to local history mock
    const history = getMockHistory(sessionId);
    const updatedHistory: RigMessage[] = [
      ...history,
      { role: "user", content: [{ type: "text", text: input }] as any },
      { role: "assistant", content: [{ text: reply }] as any }
    ];
    saveMockHistory(sessionId, updatedHistory);

    // Update session updated_at
    const sessions = getMockSessions();
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, updated_at: Date.now() } : s
    );
    saveMockSessions(updatedSessions);

    return {
      message: reply,
      provider: "simulator"
    };
  }
  return await invoke<ChatResponse>("prompt", { 
    sessionId, 
    input, 
    attachments: attachments || null 
  });
};

export const streamPrompt = async (
  sessionId: string,
  input: string,
  attachments: string[] | null,
  onToken: (token: string) => void
): Promise<ChatResponse> => {
  if (!isTauri()) {
    console.info("[chatService] Non-Tauri environment, simulating stream.");
    await new Promise(r => setTimeout(r, 400)); // Initial latency

    let reply = `[SIMULATOR] Core uplink established. I have received your prompt.`;
    if (attachments && attachments.length > 0) {
      reply = `[SIMULATOR] I noticed the following attached file path(s): ${attachments.join(", ")}. In a Tauri environment, the agent will read these paths using its ReadDocumentTool.`;
    }

    const simulationThinking = `<think>\nAnalyzing prompt: "${input}"\nValidating secure uplink...\nDrafting simulated response.\n</think>\n`;
    const fullReply = simulationThinking + reply;

    const chunkSize = 6;
    for (let i = 0; i < fullReply.length; i += chunkSize) {
      const chunk = fullReply.slice(i, i + chunkSize);
      onToken(chunk);
      await new Promise(r => setTimeout(r, 15));
    }

    // Append to local history mock
    const history = getMockHistory(sessionId);
    const updatedHistory: RigMessage[] = [
      ...history,
      { role: "user", content: [{ type: "text", text: input }] as any },
      { role: "assistant", content: [{ text: fullReply }] as any }
    ];
    saveMockHistory(sessionId, updatedHistory);

    // Update session updated_at
    const sessions = getMockSessions();
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, updated_at: Date.now() } : s
    );
    saveMockSessions(updatedSessions);

    return {
      message: fullReply,
      provider: "simulator"
    };
  }

  const channel = new Channel<string>(onToken);

  return await invoke<ChatResponse>("stream_prompt", {
    sessionId,
    input,
    attachments: attachments || null,
    channel,
  });
};

export const countTokens = async (prompt: string, response?: string): Promise<TokenCountResponse> => {
  if (!isTauri()) {
    const prompt_tokens = Math.ceil(prompt.length / 4);
    const response_tokens = response ? Math.ceil(response.length / 4) : 0;
    return {
      prompt_tokens,
      response_tokens,
      total_tokens: prompt_tokens + response_tokens,
    };
  }
  return await invoke<TokenCountResponse>("count_tokens", {
    prompt,
    response: response || null,
  });
};

// ─── Session Management ─────────────────────────────────────────────────────

export const createSession = async (title?: string): Promise<string> => {
  if (!isTauri()) {
    const id = "session-simulated-" + Math.random().toString(36).substring(2, 9);
    const sessions = getMockSessions();
    const newSession: Session = {
      id,
      title: title || 'New Session',
      created_at: Date.now(),
      updated_at: Date.now()
    };
    saveMockSessions([newSession, ...sessions]);
    return id;
  }
  return await invoke<string>("create_session", { title: title ?? null });
};

export const listSessions = async (): Promise<Session[]> => {
  if (!isTauri()) {
    return getMockSessions().sort((a, b) => b.updated_at - a.updated_at);
  }
  return await invoke<Session[]>("list_sessions");
};

export const getHistory = async (sessionId: string): Promise<RigMessage[]> => {
  if (!isTauri()) {
    return getMockHistory(sessionId);
  }
  return await invoke<RigMessage[]>("get_history", { sessionId });
};

export const renameSession = async (sessionId: string, title: string): Promise<void> => {
  if (!isTauri()) {
    const sessions = getMockSessions();
    const updated = sessions.map(s => s.id === sessionId ? { ...s, title, updated_at: Date.now() } : s);
    saveMockSessions(updated);
    return;
  }
  return await invoke("rename_session", { sessionId, title });
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  if (!isTauri()) {
    const sessions = getMockSessions();
    const updated = sessions.filter(s => s.id !== sessionId);
    saveMockSessions(updated);
    // Cleanup history
    localStorage.removeItem(MOCK_HISTORY_KEY_PREFIX + sessionId);
    return;
  }
  return await invoke("delete_session", { sessionId });
};

// ─── Provider Management ────────────────────────────────────────────────────

export const getChatProviders = async (): Promise<string[]> => {
  if (!isTauri()) {
    return ["OpenAI", "Anthropic", "Ollama (Local)"];
  }
  return await invoke<string[]>("get_chat_providers");
};

export const setChatProvider = async (provider: string): Promise<void> => {
  if (!isTauri()) {
    console.log("[chatService] Set provider simulation to:", provider);
    return;
  }
  return await invoke("set_chat_provider", { provider });
};
