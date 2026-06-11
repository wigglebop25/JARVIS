export interface ToolCall {
  name: string;
  args: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  tokenCount?: number;
  toolCalls?: ToolCall[];
}
