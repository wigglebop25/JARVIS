import { RigMessage } from '@/types/tauri';
import { ToolCall, Message, MessagePart } from './types';
import { parseThinking } from '@/utils/chatUtils';

/** Check if a message is a tool result (should not render as user prompt) */
export const isToolResultMessage = (content: unknown): boolean => {
  if (!Array.isArray(content)) return false;
  return content.some((item: unknown) => {
    if (item && typeof item === 'object' && 'type' in (item as Record<string, unknown>)) {
      return (item as Record<string, string>).type === 'toolresult';
    }
    return false;
  });
};

/** Extract text only from content (skips tool calls and tool results) */
export const parseContent = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item: unknown) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          if (obj.function || obj.type === 'toolresult') return '';
          if (typeof obj.text === 'string') return obj.text;
          if (Array.isArray(obj.content)) {
            return obj.content.map((sub: unknown) => {
              if (sub && typeof sub === 'object' && 'text' in (sub as Record<string, unknown>)) {
                return (sub as Record<string, string>).text || '';
              }
              return '';
            }).filter(Boolean).join('\n');
          }
          if (typeof obj.content === 'string') return obj.content;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  return '';
};

/** Extract tool calls from a content array */
export const extractToolCalls = (content: unknown): ToolCall[] => {
  if (!Array.isArray(content)) return [];
  return content
    .filter((item: unknown) => {
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        return obj.function && typeof obj.function === 'object';
      }
      return false;
    })
    .map((item: unknown) => {
      const obj = item as { function?: { name?: string; arguments?: unknown } };
      return {
        name: obj.function?.name || 'unknown',
        args: obj.function?.arguments
          ? typeof obj.function.arguments === 'string'
            ? obj.function.arguments
            : JSON.stringify(obj.function.arguments)
          : '',
      };
    });
};

/** Map backend RigMessage[] → frontend Message[], consolidating consecutive assistant messages */
export const mapHistory = (history: RigMessage[]): Message[] => {
  const filtered = history.filter((msg) => !isToolResultMessage(msg.content));
  const result: Message[] = [];

  for (const msg of filtered) {
    const isAssistant = msg.role === 'assistant' || msg.role === 'model';
    const prev = result[result.length - 1];

    const parts: MessagePart[] = [];

    if (Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          if (obj.function) {
            const funcObj = obj.function as Record<string, unknown>;
            parts.push({
              kind: 'tool_call',
              id: (obj.id as string) || (funcObj.name as string) || `tc-${Date.now()}-${Math.random()}`,
              name: (funcObj.name as string) || 'unknown',
              args: funcObj.arguments
                ? typeof funcObj.arguments === 'string'
                  ? funcObj.arguments
                  : JSON.stringify(funcObj.arguments)
                : '',
              isDone: true,
            });
          } else if (typeof obj.text === 'string') {
            const text = obj.text as string;
            if (isAssistant) {
              const parsed = parseThinking(text);
              if (parsed.hasThinking && parsed.thinking) {
                parts.push({
                  kind: 'thinking',
                  id: `parsed-from-<think>-${parts.length}`,
                  content: parsed.thinking,
                  isDone: parsed.isThinkingDone,
                });
              }
              if (parsed.content) {
                parts.push({ kind: 'text', content: parsed.content });
              }
            } else {
              parts.push({ kind: 'text', content: text });
            }
          }
        }
      }
    } else if (typeof msg.content === 'string') {
      parts.push({ kind: 'text', content: msg.content as string });
    }

    if (isAssistant && prev && prev.sender === 'jarvis') {
      prev.parts.push(...parts);
    } else {
      result.push({
        id: `hist-${result.length}-${Date.now()}`,
        sender: isAssistant ? 'jarvis' : 'user',
        parts,
      });
    }
  }

  return result;
};

/** Memo comparator for Message items */
export const areMessagesEqual = (prevProps: { msg: Message }, nextProps: { msg: Message }): boolean => {
  if (prevProps.msg.id !== nextProps.msg.id) return false;
  if (prevProps.msg.parts.length !== nextProps.msg.parts.length) return false;
  for (let i = 0; i < prevProps.msg.parts.length; i++) {
    const a = prevProps.msg.parts[i];
    const b = nextProps.msg.parts[i];
    if (a.kind !== b.kind) return false;
    if (a.kind === 'text' && b.kind === 'text' && a.content !== b.content) return false;
    if (a.kind === 'thinking' && b.kind === 'thinking' && (a.content !== b.content || a.isDone !== b.isDone)) return false;
    if (a.kind === 'tool_call' && b.kind === 'tool_call' && (a.name !== b.name || a.args !== b.args || a.isDone !== b.isDone)) return false;
  }
  return true;
};
