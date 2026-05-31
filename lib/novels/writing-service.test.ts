import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NovelStatus } from "../../db/schema";

const repository = vi.hoisted(() => ({
  findOwnedNovel: vi.fn(),
  getNovelWritingChapters: vi.fn(),
  resetNovelForWriting: vi.fn(),
  resumeNovelWriting: vi.fn(),
}));

const writer = vi.hoisted(() => ({
  generateNovel: vi.fn(),
}));

vi.mock("./repository", () => repository);
vi.mock("../writer/generator", () => writer);

const baseNovel = {
  id: "novel-1",
  userId: "user-1",
  title: "星轨回声",
  status: "planning" as NovelStatus,
  coreConfig: {
    genre: "科幻",
    protagonist: "女调查员",
    conflict: "追查失踪真相",
  },
  customConfig: {
    worldbuilding: "近未来都市",
    perspective: "第三人称限制",
    tone: "紧张刺激",
    theme: "成长与蜕变",
    audience: "大众读者",
    chapterCount: 20,
  },
};

async function loadService() {
  return import("./writing-service");
}

describe("writing-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("startNovelWriting 将 planning 小说切换为 in_progress 并重置章节状态", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(baseNovel);
    repository.resetNovelForWriting.mockResolvedValueOnce(undefined);

    const { startNovelWriting } = await loadService();
    const result = await startNovelWriting({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(repository.resetNovelForWriting).toHaveBeenCalledWith("novel-1");
    expect(result).toEqual({
      novelId: "novel-1",
      status: "in_progress",
    });
  });

  it("startNovelWriting 在 failed 小说上恢复写作时只重置未完成章节", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...baseNovel,
      status: "failed" as NovelStatus,
    });
    repository.resumeNovelWriting.mockResolvedValueOnce(undefined);

    const { startNovelWriting } = await loadService();
    const result = await startNovelWriting({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(repository.resumeNovelWriting).toHaveBeenCalledWith("novel-1");
    expect(repository.resetNovelForWriting).not.toHaveBeenCalled();
    expect(result).toEqual({
      novelId: "novel-1",
      status: "in_progress",
    });
  });

  it("streamNovelWriting 把 generator 回调桥接为标准 SSE 事件", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...baseNovel,
      status: "in_progress" as NovelStatus,
    });
    writer.generateNovel.mockImplementationOnce(async (_novelId, callbacks) => {
      callbacks.onChapterStart?.(1);
      callbacks.onContentChunk?.(1, "第一段正文");
      callbacks.onValidationStart?.(1);
      callbacks.onValidationResult?.(
        1,
        {
          passed: true,
          wordCountValid: true,
          suspenseValid: true,
        },
        0,
      );
      callbacks.onChapterComplete?.(1, "第一段正文");
      callbacks.onNovelComplete?.();
      return true;
    });

    const { streamNovelWriting } = await loadService();
    const response = await streamNovelWriting({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const body = await response.text();
    expect(body).toContain("event: chapter_start");
    expect(body).toContain('"chapterNumber":1');
    expect(body).toContain("event: content_chunk");
    expect(body).toContain("第一段正文");
    expect(body).toContain("event: validation_start");
    expect(body).toContain("event: validation_result");
    expect(body).toContain("event: chapter_complete");
    expect(body).toContain("event: novel_complete");
    expect(body).toContain('"status":"completed"');
  });

  it("streamNovelWriting 在生成失败时输出 error 事件", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...baseNovel,
      status: "in_progress" as NovelStatus,
    });
    writer.generateNovel.mockImplementationOnce(async (_novelId, callbacks) => {
      callbacks.onChapterStart?.(1);
      callbacks.onError?.(new Error("Upstream provider timeout"));
      return false;
    });

    const { streamNovelWriting } = await loadService();
    const response = await streamNovelWriting({
      userId: "user-1",
      novelId: "novel-1",
    });

    const body = await response.text();
    expect(body).toContain("event: error");
    expect(body).toContain("Upstream provider timeout");
    expect(body).toContain('"status":"failed"');
  });

  it("loadWritingWorkspace 返回标题、状态与章节工作台数据", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...baseNovel,
      status: "in_progress" as NovelStatus,
    });
    repository.getNovelWritingChapters.mockResolvedValueOnce([
      {
        chapterNumber: 1,
        title: "雨夜信号",
        outlineSummary: "核心事件: 林夏锁定广播塔",
        status: "pending",
        content: "",
        retryCount: 0,
        passed: false,
        wordCountValid: false,
        suspenseValid: false,
        validationLog: null,
      },
    ]);

    const { loadWritingWorkspace } = await loadService();
    const result = await loadWritingWorkspace({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(result).toEqual({
      title: "星轨回声",
      novelStatus: "in_progress",
      chapters: [
        {
          chapterNumber: 1,
          title: "雨夜信号",
          outlineSummary: "核心事件: 林夏锁定广播塔",
          status: "pending",
          content: "",
          retryCount: 0,
          passed: false,
          wordCountValid: false,
          suspenseValid: false,
          validationLog: null,
        },
      ],
    });
  });
});
