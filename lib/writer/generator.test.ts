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
  chapters: {
    id: "chapters",
    novelId: "novelId",
    status: "status",
    chapterNumber: "chapterNumber",
  },
}));

describe("Generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("模拟3次校验失败并重写，第4次校验失败抛出异常并挂起任务", async () => {
    // 模拟数据库返回包含一个需要写的章节
    const mockChapters = [
      {
        id: "c1",
        chapterNumber: 1,
        outlineSummary: "大纲1",
        status: "pending",
        retryCount: 0,
        content: "",
      },
    ];

    // 我们在这个测试里简单提供一个自定义的 db 模拟用于测试
    // 由于真实的 drizzle 链式调用比较难完全通过对象模拟，
    // 在这里我们主要测试业务逻辑中 generator 对依赖(llm, validator)的调用与重试次数
    // 所以可以把 db 调用抽象到一个 data access 方法中或者在 generator 里处理

    // 为了让测试简单且聚焦于重试逻辑，我们使用依赖注入或者直接 mock data access
    // 假设 db.query.chapters.findMany 被使用：
    mockDb.select.mockImplementation(() => {
      return {
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(mockChapters),
          }),
        }),
      };
    });

    mockDb.update.mockImplementation(() => {
      return {
        set: () => ({
          where: () => Promise.resolve(),
        }),
      };
    });

    // 模拟 LLM stream
    async function* asyncGenerator() {
      yield "一";
      yield "段";
      yield "话";
    }
    mockGenerateStream.mockReturnValue(asyncGenerator());

    // 模拟 Validator 始终失败
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

    // 调用生成器
    await generateNovel("test-novel-id", callbacks);

    // 应该调用 LLM 生成 4 次（初始1次 + 重试3次）
    expect(mockGenerateStream).toHaveBeenCalledTimes(4);

    // Validator 应该被调用 4 次
    expect(mockValidateChapter).toHaveBeenCalledTimes(4);

    // 回调应触发 onError
    expect(callbacks.onError).toHaveBeenCalled();
    const errorArg = callbacks.onError.mock.calls[0][0] as Error;
    expect(errorArg.message).toContain("达到最大重试次数");

    // 确认尝试更新数据库状态为 failed
    expect(mockDb.update).toHaveBeenCalled();
  });
});
