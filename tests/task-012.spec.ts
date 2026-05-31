import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());

const service = vi.hoisted(() => ({
  loadReadableNovel: vi.fn(),
  saveChapterContent: vi.fn(),
  polishChapterSelection: vi.fn(),
  exportNovelMarkdown: vi.fn(),
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/novels/reader-service", () => service);

async function loadModule<T>(path: string): Promise<T> {
  return import(path) as Promise<T>;
}

describe("TASK-012 routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("GET /api/novel/[id]/chapters 返回章节列表", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.loadReadableNovel.mockResolvedValueOnce({
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
          content: "第一章正文",
        },
      ],
    });

    const { GET } = await loadModule<
      typeof import("../app/api/novel/[id]/chapters/route")
    >("../app/api/novel/[id]/chapters/route");

    const response = await GET(
      new NextRequest("http://localhost/api/novel/novel-1/chapters"),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
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
          content: "第一章正文",
        },
      ],
    });
  });

  it("PUT /api/novel/[id]/chapter/[chapterNumber] 保存正文并返回新字数", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.saveChapterContent.mockResolvedValueOnce({
      success: true,
      newWordCount: 12,
    });

    const { PUT } = await loadModule<
      typeof import("../app/api/novel/[id]/chapter/[chapterNumber]/route")
    >("../app/api/novel/[id]/chapter/[chapterNumber]/route");

    const response = await PUT(
      new NextRequest("http://localhost/api/novel/novel-1/chapter/2", {
        method: "PUT",
        body: JSON.stringify({
          content: "新的章节正文内容",
        }),
      }),
      {
        params: Promise.resolve({ id: "novel-1", chapterNumber: "2" }),
      },
    );

    expect(response.status).toBe(200);
    expect(service.saveChapterContent).toHaveBeenCalledWith({
      userId: "user-1",
      novelId: "novel-1",
      chapterNumber: 2,
      content: "新的章节正文内容",
    });
    expect(await response.json()).toEqual({
      success: true,
      newWordCount: 12,
    });
  });

  it("POST /api/novel/[id]/chapter/[chapterNumber]/polish 返回润色结果", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.polishChapterSelection.mockResolvedValueOnce({
      polishedText: "润色后的选中文本",
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/chapter/[chapterNumber]/polish/route")
    >("../app/api/novel/[id]/chapter/[chapterNumber]/polish/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/novel-1/chapter/2/polish", {
        method: "POST",
        body: JSON.stringify({
          selectedText: "原始选中文本",
          surroundingContext: "前后文",
        }),
      }),
      {
        params: Promise.resolve({ id: "novel-1", chapterNumber: "2" }),
      },
    );

    expect(response.status).toBe(200);
    expect(service.polishChapterSelection).toHaveBeenCalledWith({
      userId: "user-1",
      novelId: "novel-1",
      chapterNumber: 2,
      selectedText: "原始选中文本",
      surroundingContext: "前后文",
    });
    expect(await response.json()).toEqual({
      polishedText: "润色后的选中文本",
    });
  });

  it("GET /api/novel/[id]/export 返回 markdown 下载响应", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.exportNovelMarkdown.mockResolvedValueOnce({
      filename: "星轨回声.md",
      content: "# 星轨回声\n\n正文",
    });

    const { GET } = await loadModule<
      typeof import("../app/api/novel/[id]/export/route")
    >("../app/api/novel/[id]/export/route");

    const response = await GET(
      new NextRequest("http://localhost/api/novel/novel-1/export"),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/markdown");
    expect(response.headers.get("content-disposition")).toContain(
      "filename*=UTF-8''%E6%98%9F%E8%BD%A8%E5%9B%9E%E5%A3%B0.md",
    );
    expect(await response.text()).toContain("# 星轨回声");
  });

  it("未登录访问 /api/novel/[id]/chapters 时返回 401", async () => {
    authMock.mockResolvedValueOnce(null);

    const { GET } = await loadModule<
      typeof import("../app/api/novel/[id]/chapters/route")
    >("../app/api/novel/[id]/chapters/route");

    const response = await GET(
      new NextRequest("http://localhost/api/novel/novel-1/chapters"),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(401);
  });
});
