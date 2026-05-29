import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLLMClient } from "./llm";

// Mock the underlying SDKs
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
});
