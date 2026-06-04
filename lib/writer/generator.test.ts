import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateNovel } from "./generator";

const { mockGenerateStream, mockGenerateText, mockValidateChapter, mockDb } =
  vi.hoisted(() => {
    return {
      mockGenerateStream: vi.fn(),
      mockGenerateText: vi.fn(),
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
  createDefaultLLMClient: vi.fn(() => ({
    generateStream: mockGenerateStream,
    generateText: mockGenerateText,
  })),
}));

vi.mock("./validator", () => ({
  validateChapter: mockValidateChapter,
}));

vi.mock("../../db", () => ({
  db: mockDb,
}));

vi.mock("../../db/schema", () => ({
  novels: {
    id: "novels",
    novelId: "novelId",
    coreConfig: "coreConfig",
    customConfig: "customConfig",
  },
  novelProfiles: {
    novelId: "novelId",
    characterProfiles: "characterProfiles",
  },
  chapters: {
    id: "chapters",
    novelId: "novelId",
    status: "status",
    chapterNumber: "chapterNumber",
    title: "title",
    outlineSummary: "outlineSummary",
    chapterSummary: "chapterSummary",
    content: "content",
    passed: "passed",
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
          "章节: 第1章 | 标题: 家族惊变 | 核心事件: 灭门 | 出场人物: 林云 | 悬念钩子: 突然揭示",
        chapterSummary: "",
        status: "pending",
        retryCount: 0,
        content: "",
        passed: false,
      },
    ];

    let selectCallIndex = 0;
    mockDb.select.mockImplementation(() => {
      selectCallIndex += 1;

      if (selectCallIndex === 1) {
        return {
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    characterProfiles: [
                      { name: "林云", role: "主角", summary: "冷静果敢的少爷" },
                    ],
                  },
                ]),
            }),
          }),
        };
      }

      if (selectCallIndex === 2) {
        return {
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    coreConfig: {
                      genre: "悬疑",
                      protagonist: "林云",
                      conflict: "灭门谜案",
                    },
                    customConfig: {
                      worldbuilding: "近未来都市",
                      perspective: "第三人称限制",
                      tone: "冷峻",
                      theme: "真相与代价",
                      audience: "成年读者",
                      chapterCount: 12,
                    },
                  },
                ]),
            }),
          }),
        };
      }

      return {
        from: () => ({
          where: () => ({
            orderBy: () => Promise.resolve(mockChapters),
          }),
        }),
      };
    });

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
    expect(firstCall.prompt).toContain("8000");
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

  it("章节通过校验后生成摘要并持久化保存", async () => {
    const mockChapters = [
      {
        id: "c1",
        chapterNumber: 1,
        title: "家族惊变",
        outlineSummary:
          "章节: 第1章 | 标题: 家族惊变 | 核心事件: 灭门 | 出场人物: 林云 | 悬念钩子: 突然揭示",
        chapterSummary: "",
        status: "pending",
        retryCount: 0,
        content: "",
        passed: false,
      },
    ];

    const chapterUpdatePayloads: Array<Record<string, unknown>> = [];

    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                characterProfiles: [
                  { name: "林云", role: "主角", summary: "冷静果敢的少爷" },
                ],
                coreConfig: {
                  genre: "悬疑",
                  protagonist: "林云",
                  conflict: "灭门谜案",
                },
                customConfig: {
                  worldbuilding: "近未来都市",
                  perspective: "第三人称限制",
                  tone: "冷峻",
                  theme: "真相与代价",
                  audience: "成年读者",
                  chapterCount: 12,
                },
              },
            ]),
          orderBy: () => Promise.resolve(mockChapters),
        }),
      }),
    }));

    mockDb.update.mockImplementation(() => ({
      set: (payload: Record<string, unknown>) => {
        chapterUpdatePayloads.push(payload);
        return {
          where: () => Promise.resolve(),
        };
      },
    }));

    async function* asyncGenerator() {
      yield "第一段";
      yield "第二段";
    }

    mockGenerateStream.mockReturnValue(asyncGenerator());
    mockGenerateText.mockResolvedValue("林云在灭门夜确认了第一条关键线索。");
    mockValidateChapter.mockResolvedValue({
      passed: true,
      wordCountValid: true,
      suspenseValid: true,
      diagnosticLog: "",
    });

    await generateNovel("test-novel-id", {});

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(mockGenerateText.mock.calls[0][0].prompt).toContain(
      "生成300-500字章节摘要",
    );
    expect(chapterUpdatePayloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          chapterSummary: "林云在灭门夜确认了第一条关键线索。",
          status: "completed",
        }),
      ]),
    );
  });

  it("恢复写作时会读取已完成章节的摘要链作为后续上下文", async () => {
    const pendingChapters = [
      {
        id: "c2",
        chapterNumber: 2,
        title: "追索",
        outlineSummary:
          "章节: 第2章 | 标题: 追索 | 核心事件: 深夜潜入 | 出场人物: 林云、苏离 | 悬念钩子: 身份暴露",
        chapterSummary: "",
        status: "pending",
        retryCount: 0,
        content: "",
        passed: false,
      },
    ];

    let selectCallIndex = 0;
    mockDb.select.mockImplementation(() => {
      selectCallIndex += 1;

      if (selectCallIndex === 1) {
        return {
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    characterProfiles: [
                      {
                        name: "林云",
                        role: "主角",
                        summary: "冷静果敢的调查者",
                      },
                      {
                        name: "苏离",
                        role: "搭档",
                        summary: "敏锐谨慎的情报员",
                      },
                    ],
                  },
                ]),
            }),
          }),
        };
      }

      if (selectCallIndex === 2) {
        return {
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    coreConfig: {
                      genre: "悬疑",
                      protagonist: "林云",
                      conflict: "广播塔谜案",
                    },
                    customConfig: {
                      worldbuilding: "近未来都市",
                      perspective: "第三人称限制",
                      tone: "冷峻",
                      theme: "真相与代价",
                      audience: "成年读者",
                      chapterCount: 12,
                    },
                  },
                ]),
            }),
          }),
        };
      }

      if (selectCallIndex === 3) {
        return {
          from: () => ({
            where: () => ({
              orderBy: () => Promise.resolve(pendingChapters),
            }),
          }),
        };
      }

      if (selectCallIndex === 4) {
        return {
          from: () => ({
            where: () => ({
              orderBy: () =>
                Promise.resolve([
                  {
                    id: "c1",
                    chapterNumber: 1,
                    title: "异响",
                    outlineSummary:
                      "章节: 第1章 | 标题: 异响 | 核心事件: 发现物证 | 出场人物: 林云 | 悬念钩子: 异常回声",
                    chapterSummary: "林云在广播塔发现失踪案的第一条物证。",
                    content:
                      "林云推开锈门，冷风卷入塔楼。\n\n他在控制台下摸到一枚染血的徽章，耳边突然响起异常回声。",
                    status: "completed",
                    passed: true,
                  },
                ]),
            }),
          }),
        };
      }

      throw new Error(`Unexpected select call: ${selectCallIndex}`);
    });

    mockDb.update.mockImplementation(() => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }));

    async function* asyncGenerator() {
      yield "第一段";
      yield "第二段";
    }

    mockGenerateStream.mockReturnValue(asyncGenerator());
    mockGenerateText.mockResolvedValue("林云与苏离正式锁定潜入目标。");
    mockValidateChapter.mockResolvedValue({
      passed: true,
      wordCountValid: true,
      suspenseValid: true,
      diagnosticLog: "",
    });

    await generateNovel("test-novel-id", {});

    const firstCall = mockGenerateStream.mock.calls[0][0];
    expect(firstCall.prompt).toContain("第1章《异响》");
    expect(firstCall.prompt).toContain("第一条物证");
    expect(firstCall.prompt).toContain("染血的徽章");
  });
});
