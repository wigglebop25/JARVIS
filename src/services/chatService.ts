import { invoke } from "@tauri-apps/api/core";
import { ChatResponse, Session, RigMessage } from "@/types/tauri";

// ─── Chat Prompt ────────────────────────────────────────────────────────────

/**
 * Sends a prompt to the JARVIS chat backend within a specific session.
 * The backend loads the session's history from the DB, runs the agent,
 * and saves the updated history back.
 */
export const sendPrompt = async (sessionId: string, input: string): Promise<ChatResponse> => {
  return await invoke<ChatResponse>("prompt", { sessionId, input });
};

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * Creates a new chat session in the backend database.
 * @returns The UUID of the newly created session.
 */
export const createSession = async (title?: string): Promise<string> => {
  return await invoke<string>("create_session", { title: title ?? null });
};

/**
 * Lists all chat sessions, ordered by most recently updated.
 */
export const listSessions = async (): Promise<Session[]> => {
  return await invoke<Session[]>("list_sessions");
};

/**
 * Retrieves the full message history for a given session.
 */
export const getHistory = async (sessionId: string): Promise<RigMessage[]> => {
  return await invoke<RigMessage[]>("get_history", { sessionId });
};

// ─── Provider Management ────────────────────────────────────────────────────

/**
 * Gets the list of available LLM providers.
 */
export const getChatProviders = async (): Promise<string[]> => {
  return await invoke<string[]>("get_chat_providers");
};

/**
 * Sets the active LLM provider.
 */
export const setChatProvider = async (provider: string): Promise<void> => {
  return await invoke("set_chat_provider", { provider });
};
