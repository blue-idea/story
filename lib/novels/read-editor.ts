type BuildPolishSelectionPayloadInput = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
  contextRadius?: number;
};

type ApplyPolishReplacementInput = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
  replacement: string;
};

export function buildPolishSelectionPayload(
  input: BuildPolishSelectionPayloadInput,
) {
  const start = Math.max(0, Math.min(input.selectionStart, input.selectionEnd));
  const end = Math.max(input.selectionStart, input.selectionEnd);

  if (start === end) {
    throw new Error("Invalid selection");
  }

  const radius = input.contextRadius ?? 160;
  const selectedText = input.content.slice(start, end).trim();

  if (!selectedText) {
    throw new Error("Invalid selection");
  }

  const contextStart = Math.max(0, start - radius);
  const contextEnd = Math.min(input.content.length, end + radius);

  return {
    selectedText,
    surroundingContext: input.content.slice(contextStart, contextEnd),
    selectionStart: start,
    selectionEnd: end,
  };
}

export function applyPolishReplacement(
  input: ApplyPolishReplacementInput,
): string {
  return [
    input.content.slice(0, input.selectionStart),
    input.replacement,
    input.content.slice(input.selectionEnd),
  ].join("");
}
