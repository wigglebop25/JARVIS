import { Message, MessagePart } from './types';
import { StreamEvent } from '@/types/tauri';

export const reduceStreamEvent = (msg: Message, ev: StreamEvent): Message => {
  switch (ev.type) {
    case 'text': {
      const parts = msg.parts.slice();
      const last = parts[parts.length - 1];
      if (last && last.kind === 'text') {
        parts[parts.length - 1] = { ...last, content: last.content + ev.delta };
      } else {
        parts.push({ kind: 'text', content: ev.delta });
      }
      return { ...msg, parts };
    }
    case 'reasoning': {
      const parts = msg.parts.slice();
      const idx = parts.findIndex(
        (p) => p.kind === 'thinking' && p.id === ev.id
      );
      if (idx >= 0) {
        const existing = parts[idx] as Extract<MessagePart, { kind: 'thinking' }>;
        parts[idx] = {
          ...existing,
          content: existing.content + ev.delta,
          isDone: existing.isDone || ev.is_final,
        };
      } else {
        parts.push({ kind: 'thinking', id: ev.id, content: ev.delta, isDone: ev.is_final });
      }
      return { ...msg, parts };
    }
    case 'tool_call_start': {
      const parts = msg.parts.slice();
      const idx = parts.findIndex(
        (p) => p.kind === 'tool_call' && p.id === ev.id
      );
      if (idx >= 0) {
        const existing = parts[idx] as Extract<MessagePart, { kind: 'tool_call' }>;
        parts[idx] = { ...existing, name: ev.name };
      } else {
        parts.push({ kind: 'tool_call', id: ev.id, name: ev.name, args: '', isDone: false });
      }
      return { ...msg, parts };
    }
    case 'tool_call_delta': {
      const parts = msg.parts.slice();
      const idx = parts.findIndex(
        (p) => p.kind === 'tool_call' && p.id === ev.id
      );
      if (idx >= 0) {
        const existing = parts[idx] as Extract<MessagePart, { kind: 'tool_call' }>;
        parts[idx] = { ...existing, args: existing.args + ev.args_delta };
      }
      return { ...msg, parts };
    }
    case 'tool_call_end': {
      const parts = msg.parts.slice();
      const idx = parts.findIndex(
        (p) => p.kind === 'tool_call' && p.id === ev.id
      );
      if (idx >= 0) {
        parts[idx] = {
          id: ev.id,
          name: (parts[idx] as Extract<MessagePart, { kind: 'tool_call' }>).name,
          kind: 'tool_call',
          args: ev.args,
          isDone: true,
        };
      }
      return { ...msg, parts };
    }
  }
};
