import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NovelStatus } from "../../db/schema";

const repository = vi.hoisted(() => ({
  findOwnedNovel: vi.fn(),
  getNovelReaderChapters: vi.fn(),
  updateChapterContent: vi.fn(),
  findChapterByNumber: vi.fn(),
  getNovelPlan: vi.fn(),
}));

const prompts = vi.hoisted(() => ({
  loadTemplate: vi.fn(
    () =>
      "# {{title}}\n\n## 人物档案\n\n{{characterProfiles}}\n\n## 大纲\n\n{{outline}}\n\n## 正文\n\n{{chaptersBody}}",
  ),
  interpolate: vi.fn((template: string, ctx: Record<string, string | number>) =>
    template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) =>
      String(ctx[key] ?? ""),
    ),
  ),
}));

const polishing = vi.hoisted(() => ({
  polishSelectedText: vi.fn(),
}));

vi.mock("./repository", () => repository);
vi.mock("../prompts", () => prompts);
vi.mock("../writer/polish", () => polishing);

const ownedNovel = {
  id: "novel-1",
  userId: "user-1",
  title: "星轨回声",
  status: "completed" as NovelStatus,
  coreConfig: {
    genre: "科幻",
    protagonist: "调查员",
    conflict: "追查真相",
  },
  customConfig: {
    worldbuilding: "近未来都市",
    perspective: "第三人称限制",
    tone: "紧张克制",
    theme: "成长与选择",
    audience: "大众读者",
    chapterCount: 12,
  },
};

async function loadService() {
  return import("./reader-service");
}

describe("reader-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-006-AC-002 获取阅读数据时返回小说标题、状态与章节列表", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    repository.getNovelReaderChapters.mockResolvedValueOnce([
      {
        chapterNumber: 1,
        title: "失序信号",
        wordCount: 3200,
        status: "completed",
        passed: true,
        retryCount: 0,
        content: "正文",
      },
    ]);

    const { loadReadableNovel } = await loadService();
    const result = await loadReadableNovel({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(result).toEqual({
      novelTitle: "星轨回声",
      status: "completed",
      chapters: [
        {
          chapterNumber: 1,
          title: "失序信号",
          wordCount: 3200,
          status: "completed",
          passed: true,
          retryCount: 0,
          content: "正文",
        },
      ],
    });
  });

  it("REQ-006-AC-002 保存章节正文时重新计算字数并落库", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    repository.updateChapterContent.mockResolvedValueOnce(true);

    const { saveChapterContent } = await loadService();
    const result = await saveChapterContent({
      userId: "user-1",
      novelId: "novel-1",
      chapterNumber: 2,
      content: "新的章节正文内容",
    });

    expect(repository.updateChapterContent).toHaveBeenCalledWith({
      novelId: "novel-1",
      chapterNumber: 2,
      content: "新的章节正文内容",
      wordCount: "新的章节正文内容".length,
    });
    expect(result).toEqual({
      success: true,
      newWordCount: "新的章节正文内容".length,
    });
  });

  it("REQ-006-AC-003 润色选中文本时只返回润色后的片段", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    repository.findChapterByNumber.mockResolvedValueOnce({
      chapterNumber: 2,
      title: "暗潮出现",
    });
    polishing.polishSelectedText.mockResolvedValueOnce("润色后的片段");

    const { polishChapterSelection } = await loadService();
    const result = await polishChapterSelection({
      userId: "user-1",
      novelId: "novel-1",
      chapterNumber: 2,
      selectedText: "原始片段",
      surroundingContext: "前后文",
    });

    expect(polishing.polishSelectedText).toHaveBeenCalledWith({
      selectedText: "原始片段",
      surroundingContext: "前后文",
    });
    expect(result).toEqual({
      polishedText: "润色后的片段",
    });
  });

  it("REQ-006-AC-001 导出时组装统一 markdown 与文件名", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    repository.getNovelPlan.mockResolvedValueOnce({
      outline: "# 故事大纲",
      characterProfiles: [
        {
          name: "林澈",
          role: "主角",
          summary: "冷静执着的调查员",
        },
      ],
      chapters: [
        {
          chapterNumber: 1,
          title: "失序信号",
          outlineSummary: "主角发现异常信号。",
        },
      ],
    });
    repository.getNovelReaderChapters.mockResolvedValueOnce([
      {
        chapterNumber: 1,
        title: "失序信号",
        wordCount: 3200,
        status: "completed",
        passed: true,
        retryCount: 0,
        content: "第一章正文",
      },
    ]);

    const { exportNovelMarkdown } = await loadService();
    const result = await exportNovelMarkdown({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(result.filename).toBe("星轨回声.md");
    expect(result.content).toContain("# 星轨回声");
    expect(result.content).toContain("林澈");
    expect(result.content).toContain("# 故事大纲");
    expect(result.content).toContain("## 第1章 失序信号");
    expect(result.content).toContain("第一章正文");
  });
});
