import { RigMessage } from '@/types/tauri';
import { ToolCall, Message } from './types';

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
    const text = parseContent(msg.content);
    const toolCalls = extractToolCalls(msg.content);
    const prev = result[result.length - 1];

    if (isAssistant && prev && prev.sender === 'jarvis') {
      if (text) prev.text = prev.text ? prev.text + '\n' + text : text;
      if (toolCalls.length > 0) {
        prev.toolCalls = [...(prev.toolCalls || []), ...toolCalls];
      }
    } else {
      result.push({
        id: `hist-${result.length}-${Date.now()}`,
        sender: isAssistant ? 'jarvis' : 'user',
        text,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      });
    }
  }

  return result;
};

/** Memo comparator for Message items */
export const areMessagesEqual = (prevProps: { msg: Message }, nextProps: { msg: Message }): boolean => {
  return prevProps.msg.id === nextProps.msg.id && prevProps.msg.text === nextProps.msg.text;
};
