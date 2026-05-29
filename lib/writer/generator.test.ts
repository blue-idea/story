import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateNovel } from "./generator";

const { mockGenerateStream, mockValidateChapter, mockDb } = vi.hoisted(() => {
  return {
    mockGenerateStream: vi.fn(),
    mockValidateChapter: vi.fn(),
    mockDb: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      execute: vi.fn(),
    },
  };
});

vi.mock("../llm", () => ({
  createLLMClient: vi.fn(() => ({
    generateStream: mockGenerateStream,
  })),
}));

vi.mock("./validator", () => ({
  validateChapter: mockValidateChapter,
}));

vi.mock("../../db", () => ({
  db: mockDb,
}));

vi.mock("../../db/schema", () => ({
  novels: { id: "novels" },
  novelProfiles: { novelId: "novelId", characterProfiles: "characterProfiles" },
  chapters: {
    id: "chapters",
    novelId: "novelId",
    status: "status",
    chapterNumber: "chapterNumber",
    title: "title",
    outlineSummary: "outlineSummary",
    retryCount: "retryCount",
  },
}));

describe("Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("模拟3次校验失败并重写，第4次校验失败抛出异常并挂起任务", async () => {
    const mockChapters = [
      {
        id: "c1",
        chapterNumber: 1,
        title: "家族惊变",
        outlineSummary:
          "章节: 第1章 | 标题: 家族惊变 | 核心事件: 灭门 | 悬念钩子: 突然揭示",
        status: "pending",
        retryCount: 0,
        content: "",
      },
    ];

    const mockProfile = {
      characterProfiles: [
        { name: "林云", role: "主角", summary: "冷静果敢的少爷" },
      ],
    };

    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([mockProfile]),
          orderBy: () => Promise.resolve(mockChapters),
        }),
      }),
    }));

    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }));

    async function* asyncGenerator() {
      yield "一";
      yield "段";
      yield "话";
    }
    mockGenerateStream.mockReturnValue(asyncGenerator());

    mockValidateChapter.mockResolvedValue({
      passed: false,
      wordCountValid: false,
      suspenseValid: false,
      diagnosticLog: "校验失败",
    });

    const callbacks = {
      onError: vi.fn(),
      onValidationResult: vi.fn(),
    };

    await generateNovel("test-novel-id", callbacks);

    expect(mockGenerateStream).toHaveBeenCalledTimes(4);
    expect(mockValidateChapter).toHaveBeenCalledTimes(4);

    const firstCall = mockGenerateStream.mock.calls[0][0];
    expect(firstCall.prompt).toContain("3000");
    expect(firstCall.prompt).toContain("悬念");
    expect(firstCall.prompt).toContain("家族惊变");
    expect(firstCall.prompt).toContain("林云");

    const rewriteCall = mockGenerateStream.mock.calls[1][0];
    expect(rewriteCall.prompt).toContain("诊断");
    expect(rewriteCall.prompt).toContain("校验失败");

    expect(callbacks.onError).toHaveBeenCalled();
    const errorArg = callbacks.onError.mock.calls[0][0] as Error;
    expect(errorArg.message).toContain("达到最大重试次数");

    expect(mockDb.update).toHaveBeenCalled();
  });
});
