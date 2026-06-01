import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_DEEPSEEK_API_URL,
  DEFAULT_DEEPSEEK_MODEL,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENAI_MODEL,
  resolveDefaultLLMConfig,
} from "../config/llm";

describe("resolveDefaultLLMConfig", () => {
  beforeEach(() => {
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_URL;
    delete process.env.DEEPSEEK_API_NAME;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_MODEL;
  });

  it("优先返回 DeepSeek openai-compatible 配置", () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-key";

    expect(resolveDefaultLLMConfig()).toEqual({
      provider: "openai",
      apiKey: "deepseek-key",
      baseUrl: DEFAULT_DEEPSEEK_API_URL,
      model: DEFAULT_DEEPSEEK_MODEL,
    });
  });

  it("支持覆盖 DeepSeek baseUrl 与 model", () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-key";
    process.env.DEEPSEEK_API_URL = "https://api.deepseek.com/v1";
    process.env.DEEPSEEK_API_NAME = "deepseek-v4-pro";

    expect(resolveDefaultLLMConfig()).toEqual({
      provider: "openai",
      apiKey: "deepseek-key",
      baseUrl: "https://api.deepseek.com/v1",
      model: "deepseek-v4-pro",
    });
  });

  it("无 DeepSeek 时回退 OpenAI", () => {
    process.env.OPENAI_API_KEY = "openai-key";

    expect(resolveDefaultLLMConfig()).toEqual({
      provider: "openai",
      model: DEFAULT_OPENAI_MODEL,
    });
  });

  it("仅有 Gemini 时回退 Gemini", () => {
    process.env.GEMINI_API_KEY = "gemini-key";

    expect(resolveDefaultLLMConfig()).toEqual({
      provider: "gemini",
      model: DEFAULT_GEMINI_MODEL,
    });
  });
});
