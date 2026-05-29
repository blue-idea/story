import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateChapter, parseSuspenseCheckResponse } from "./validator";

const mockGenerateText = vi.fn();

vi.mock("../llm", () => ({
  createLLMClient: vi.fn(() => ({
    generateText: mockGenerateText,
  })),
}));

describe("parseSuspenseCheckResponse", () => {
  it("解析 JSON hasHook", () => {
    expect(parseSuspenseCheckResponse('{ "hasHook": true }')).toBe(true);
    expect(parseSuspenseCheckResponse('{ "hasHook": false }')).toBe(false);
  });

  it("兼容纯文本 true/false", () => {
    expect(parseSuspenseCheckResponse("true")).toBe(true);
    expect(parseSuspenseCheckResponse("false")).toBe(false);
  });
});

describe("Validator", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("当字数不足且无悬念时，返回失败状态及详细诊断建议", async () => {
    mockGenerateText.mockResolvedValue('{ "hasHook": false }');
    const shortText = "字".repeat(100);

    const result = await validateChapter(shortText, 1);

    expect(result.passed).toBe(false);
    expect(result.wordCountValid).toBe(false);
    expect(result.suspenseValid).toBe(false);
    expect(result.diagnosticLog).toContain("字数 100，少于标准");
    expect(result.diagnosticLog).toContain("扩充写");
    expect(result.diagnosticLog).toContain("末尾缺乏悬念或钩子");
  });

  it("当字数达标且包含悬念时，验证通过", async () => {
    mockGenerateText.mockResolvedValue('{ "hasHook": true }');
    const longText = "字".repeat(3500);

    const result = await validateChapter(longText, 2);

    expect(result.passed).toBe(true);
    expect(result.wordCountValid).toBe(true);
    expect(result.suspenseValid).toBe(true);
    expect(result.diagnosticLog).toBeUndefined();
  });

  it("使用 phase4-suspense-check 外置 prompt", async () => {
    mockGenerateText.mockResolvedValue('{ "hasHook": true }');
    const longText = "字".repeat(3500);

    await validateChapter(longText, 3);

    const call = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain("hasHook");
    expect(call.prompt).toContain("末尾片段");
    expect(call.prompt).toContain("章节号：3");
    expect(call.systemInstruction).toMatch(/审核|质量/);
  });
});
