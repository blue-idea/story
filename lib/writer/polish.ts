import { createDefaultLLMClient } from "../llm";
import { getSystem, renderInstruction } from "../prompts";

function createPolishClient() {
  return createDefaultLLMClient();
}

export async function polishSelectedText(input: {
  selectedText: string;
  surroundingContext?: string;
}): Promise<string> {
  const llm = createPolishClient();
  const prompt = renderInstruction("phase3-chapter-polish", {
    selectedText: input.selectedText,
    surroundingContext: input.surroundingContext ?? "",
  });

  return await llm.generateText({
    prompt,
    systemInstruction: getSystem("editor"),
  });
}
