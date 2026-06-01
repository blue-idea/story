import { beforeEach, describe, expect, it, vi } from "vitest";

const prompts = vi.hoisted(() => ({
  getSystem: vi.fn(() => "editor-system"),
  renderInstruction: vi.fn(() => "rendered-polish-prompt"),
}));

const llm = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

const createDefaultLLMClientMock = vi.hoisted(() => vi.fn(() => llm));

vi.mock("../prompts", () => prompts);
vi.mock("../llm", () => ({
  createDefaultLLMClient: createDefaultLLMClientMock,
}));

async function loadModule() {
  return import("./polish");
}

describe("polish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.GEMINI_API_KEY;
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.DEEPSEEK_API_URL;
    delete process.env.DEEPSEEK_API_NAME;
    delete process.env.OPENAI_API_KEY;
  });

  it("REQ-006-AC-003 使用 phase3-chapter-polish 指令润色选中文本", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    llm.generateText.mockResolvedValueOnce("润色后的片段");

    const { polishSelectedText } = await loadModule();
    const result = await polishSelectedText({
      selectedText: "原始片段",
      surroundingContext: "前后文",
    });

    expect(createDefaultLLMClientMock).toHaveBeenCalledWith();
    expect(prompts.renderInstruction).toHaveBeenCalledWith(
      "phase3-chapter-polish",
      {
        selectedText: "原始片段",
        surroundingContext: "前后文",
      },
    );
    expect(llm.generateText).toHaveBeenCalledWith({
      prompt: "rendered-polish-prompt",
      systemInstruction: "editor-system",
    });
    expect(result).toBe("润色后的片段");
  });

  it("没有 GEMINI_API_KEY 时回退到 DeepSeek 的 openai-compatible 配置", async () => {
    process.env.DEEPSEEK_API_KEY = "deepseek-key";
    process.env.DEEPSEEK_API_URL = "https://api.deepseek.com";
    process.env.DEEPSEEK_API_NAME = "deepseek-chat";
    llm.generateText.mockResolvedValueOnce("润色后的片段");

    const { polishSelectedText } = await loadModule();
    await polishSelectedText({
      selectedText: "原始片段",
      surroundingContext: "前后文",
    });

    expect(createDefaultLLMClientMock).toHaveBeenCalledWith();
  });
});
