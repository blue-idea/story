import { beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultLLMClient, createLLMClient } from "./llm";

const openAiConstructor = vi.hoisted(() => vi.fn());

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel() {
        return {
          generateContent: vi.fn().mockResolvedValue({
            response: { text: () => "gemini-mocked-text" },
          }),
          generateContentStream: vi.fn().mockResolvedValue({
            stream: (async function* () {
              yield { text: () => "gemini-" };
              yield { text: () => "stream" };
            })(),
          }),
        };
      }
    },
  };
});

vi.mock("openai", () => {
  return {
    default: class {
      constructor(config: unknown) {
        openAiConstructor(config);
      }

      chat = {
        completions: {
          create: vi.fn().mockImplementation(async (opts) => {
            if (opts.stream) {
              return (async function* () {
                yield { choices: [{ delta: { content: "openai-" } }] };
                yield { choices: [{ delta: { content: "stream" } }] };
              })();
            }
            return {
              choices: [{ message: { content: "openai-mocked-text" } }],
            };
          }),
        },
      };
    },
  };
});

describe("LLM Client Adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_URL;
    delete process.env.DEEPSEEK_API_NAME;
  });

  it("generates text using gemini provider", async () => {
    const client = createLLMClient({ provider: "gemini", apiKey: "test-key" });
    const result = await client.generateText({ prompt: "Hello" });
    expect(result).toBe("gemini-mocked-text");
  });

  it("generates text stream using gemini provider", async () => {
    const client = createLLMClient({ provider: "gemini", apiKey: "test-key" });
    const stream = client.generateStream({ prompt: "Hello stream" });

    let result = "";
    for await (const chunk of stream) {
      result += chunk;
    }
    expect(result).toBe("gemini-stream");
  });

  it("generates text using openai provider", async () => {
    const client = createLLMClient({ provider: "openai", apiKey: "test-key" });
    const result = await client.generateText({ prompt: "Hello" });
    expect(result).toBe("openai-mocked-text");
  });

  it("generates text stream using openai provider", async () => {
    const client = createLLMClient({ provider: "openai", apiKey: "test-key" });
    const stream = client.generateStream({ prompt: "Hello stream" });

    let result = "";
    for await (const chunk of stream) {
      result += chunk;
    }
    expect(result).toBe("openai-stream");
  });

  it("passes openai-compatible base URL to the sdk constructor", async () => {
    const client = createLLMClient({
      provider: "openai",
      apiKey: "test-key",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
    });

    await client.generateText({ prompt: "Hello" });

    expect(openAiConstructor).toHaveBeenCalledWith({
      apiKey: "test-key",
      baseURL: "https://api.deepseek.com",
    });
  });

  it("createDefaultLLMClient 在配置 DeepSeek 时默认走 openai-compatible", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-key";
    process.env.DEEPSEEK_API_URL = "https://api.deepseek.com";
    process.env.DEEPSEEK_API_NAME = "deepseek-v4-flash";

    const client = createDefaultLLMClient();
    await client.generateText({ prompt: "Hello" });

    expect(openAiConstructor).toHaveBeenCalledWith({
      apiKey: "deepseek-key",
      baseURL: "https://api.deepseek.com",
    });
  });
});
