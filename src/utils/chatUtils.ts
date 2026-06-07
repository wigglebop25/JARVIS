export interface ParsedMessageContent {
  thinking?: string;
  content: string;
  isThinkingDone: boolean;
  hasThinking: boolean;
}

/**
 * Parses assistant message text to separate <think>...</think> blocks from content.
 */
export const parseThinking = (text: string): ParsedMessageContent => {
  if (!text) {
    return { content: '', isThinkingDone: true, hasThinking: false };
  }

  const thinkStart = text.indexOf('<think>');
  if (thinkStart === -1) {
    return { content: text, isThinkingDone: true, hasThinking: false };
  }

  const thinkEnd = text.indexOf('</think>');
  if (thinkEnd === -1) {
    // Thinking is in progress (unterminated <think>)
    const thinking = text.slice(thinkStart + 7);
    return {
      thinking,
      content: '',
      isThinkingDone: false,
      hasThinking: true
    };
  } else {
    // Thinking is complete
    const thinking = text.slice(thinkStart + 7, thinkEnd);
    const content = text.slice(thinkEnd + 8); // skip </think> (8 chars)
    return {
      thinking,
      content,
      isThinkingDone: true,
      hasThinking: true
    };
  }
};

/**
 * Fallback token estimator based on standard character and word counts.
 */
export const estimateTokens = (text: string): number => {
  if (!text) return 0;
  const wordCount = text.trim().split(/\s+/).length;
  const charApprox = Math.ceil(text.length / 4);
  const wordApprox = Math.ceil(wordCount * 1.35);
  return Math.max(charApprox, wordApprox);
};
