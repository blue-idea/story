import { createLLMClient } from "../llm";
import { getSystem, renderInstruction } from "../prompts";

function createPolishClient() {
  if (process.env.GEMINI_API_KEY) {
    return createLLMClient({ provider: "gemini" });
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return createLLMClient({
      provider: "openai",
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_API_URL,
      model: process.env.DEEPSEEK_API_NAME,
    });
  }

  if (process.env.OPENAI_API_KEY) {
    return createLLMClient({ provider: "openai" });
  }

  return createLLMClient({ provider: "gemini" });
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
