import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateChapter } from "./validator";

const mockGenerateText = vi.fn();

// Mock LLM client
vi.mock("../llm", () => {
  return {
    createLLMClient: vi.fn(() => ({
      generateText: mockGenerateText,
    })),
  };
});

describe("Validator", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });
  it("当字数不足且无悬念时，返回失败状态及详细诊断建议", async () => {
    mockGenerateText.mockResolvedValue("false");
    // 构建一个100个字的短文本
    const shortText = "字".repeat(100);

    const result = await validateChapter(shortText);

    expect(result.passed).toBe(false);
    expect(result.wordCountValid).toBe(false);
    expect(result.suspenseValid).toBe(false); // 假设此时模拟的是包含悬念或者不包含，我们先测试字数不足的情况
    expect(result.diagnosticLog).toContain("字数 100，少于标准");
    expect(result.diagnosticLog).toContain("扩充写");
    expect(result.diagnosticLog).toContain("末尾缺乏悬念或钩子");
  });

  it("当字数达标且包含悬念时，验证通过", async () => {
    mockGenerateText.mockResolvedValue("true");
    // 构建一个3500字的文本
    const longText = "字".repeat(3500);

    const result = await validateChapter(longText);

    expect(result.passed).toBe(true);
    expect(result.wordCountValid).toBe(true);
    expect(result.suspenseValid).toBe(true);
    expect(result.diagnosticLog).toBeUndefined();
  });
});
