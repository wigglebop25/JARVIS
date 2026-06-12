export interface ToolCall {
  name: string;
  args: string;
}

export type MessagePart =
  | { kind: 'text'; content: string; isDone?: boolean }
  | { kind: 'thinking'; id: string; content: string; isDone: boolean }
  | { kind: 'tool_call'; id: string; name: string; args: string; isDone: boolean };

export interface Message {
  id: string;
  sender: 'user' | 'jarvis';
  parts: MessagePart[];
  tokenCount?: number;
}

export const getMessageText = (msg: Message): string =>
  msg.parts
    .filter((p): p is Extract<MessagePart, { kind: 'text' }> => p.kind === 'text')
    .map((p) => p.content)
    .join('');
