export type DefaultLLMConfig = {
  provider: "gemini" | "openai";
  apiKey?: string;
  model?: string;
  baseUrl?: string;
};

export const DEFAULT_GEMINI_MODEL = "gemini-1.5-flash";
export const DEFAULT_OPENAI_MODEL = "gpt-3.5-turbo";
export const DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

function normalizeEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** 默认模型优先级：DeepSeek > OpenAI > Gemini */
export function resolveDefaultLLMConfig(
  env: NodeJS.ProcessEnv = process.env,
): DefaultLLMConfig {
  const deepSeekApiKey = normalizeEnv(env.DEEPSEEK_API_KEY);
  if (deepSeekApiKey) {
    return {
      provider: "openai",
      apiKey: deepSeekApiKey,
      baseUrl: normalizeEnv(env.DEEPSEEK_API_URL) ?? DEFAULT_DEEPSEEK_API_URL,
      model: normalizeEnv(env.DEEPSEEK_API_NAME) ?? DEFAULT_DEEPSEEK_MODEL,
    };
  }

  if (normalizeEnv(env.OPENAI_API_KEY)) {
    return {
      provider: "openai",
      model: normalizeEnv(env.OPENAI_MODEL) ?? DEFAULT_OPENAI_MODEL,
    };
  }

  return {
    provider: "gemini",
    model: normalizeEnv(env.GEMINI_MODEL) ?? DEFAULT_GEMINI_MODEL,
  };
}
