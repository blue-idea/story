import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSuspenseCheckResponse, validateChapter } from "./validator";

const mockGenerateText = vi.fn();

vi.mock("../llm", () => ({
  createDefaultLLMClient: vi.fn(() => ({
    generateText: mockGenerateText,
  })),
}));

describe("parseSuspenseCheckResponse", () => {
  it("parses JSON hasHook", () => {
    expect(parseSuspenseCheckResponse('{ "hasHook": true }')).toBe(true);
    expect(parseSuspenseCheckResponse('{ "hasHook": false }')).toBe(false);
  });

  it("supports plain text true/false responses", () => {
    expect(parseSuspenseCheckResponse("true")).toBe(true);
    expect(parseSuspenseCheckResponse("false")).toBe(false);
  });
});

describe("validateChapter", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("returns diagnostics when the chapter is too short and has no suspense hook", async () => {
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

  it("passes when the chapter stays within the range and includes suspense", async () => {
    mockGenerateText.mockResolvedValue('{ "hasHook": true }');
    const longText = "字".repeat(3500);

    const result = await validateChapter(longText, 2);

    expect(result.passed).toBe(true);
    expect(result.wordCountValid).toBe(true);
    expect(result.suspenseValid).toBe(true);
    expect(result.diagnosticLog).toBeUndefined();
  });

  it("accepts chapters at the 8000 character upper bound", async () => {
    mockGenerateText.mockResolvedValue('{ "hasHook": true }');
    const boundaryText = "字".repeat(8000);

    const result = await validateChapter(boundaryText, 2);

    expect(result.passed).toBe(true);
    expect(result.wordCountValid).toBe(true);
    expect(result.suspenseValid).toBe(true);
  });

  it("rejects chapters that exceed the 8000 character upper bound", async () => {
    mockGenerateText.mockResolvedValue('{ "hasHook": true }');
    const tooLongText = "字".repeat(8001);

    const result = await validateChapter(tooLongText, 2);

    expect(result.passed).toBe(false);
    expect(result.wordCountValid).toBe(false);
    expect(result.suspenseValid).toBe(true);
    expect(result.diagnosticLog).toContain("8001");
    expect(result.diagnosticLog).toContain("8000");
  });

  it("uses the externalized phase4-suspense-check prompt", async () => {
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
