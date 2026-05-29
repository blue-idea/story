import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());

const service = vi.hoisted(() => ({
  createWizardDraft: vi.fn(),
  updateWizardDraft: vi.fn(),
  generateWizardSuggestion: vi.fn(),
  confirmWizardConfig: vi.fn(),
  generateWizardTitles: vi.fn(),
  confirmWizardTitle: vi.fn(),
  loadNovelPlan: vi.fn(),
  saveChapterOutlineSummary: vi.fn(),
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/novels/wizard-service", () => service);

async function loadModule<T>(path: string): Promise<T> {
  return import(path) as Promise<T>;
}

describe("TASK-010 routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/novel/wizard 在已登录时创建 draft", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.createWizardDraft.mockResolvedValueOnce({
      novelId: "novel-1",
      status: "draft",
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/wizard/route")
    >("../app/api/novel/wizard/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/wizard", {
        method: "POST",
        body: JSON.stringify({
          coreConfig: {
            genre: "科幻",
            protagonist: "女调查员",
            conflict: "追查失踪真相",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      novelId: "novel-1",
      status: "draft",
    });
  });

  it("PATCH /api/novel/[id]/wizard 把部分配置透传给 service", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.updateWizardDraft.mockResolvedValueOnce({
      novelId: "novel-1",
      status: "draft",
      customConfig: {
        worldbuilding: "月环殖民地",
      },
    });

    const { PATCH } = await loadModule<
      typeof import("../app/api/novel/[id]/wizard/route")
    >("../app/api/novel/[id]/wizard/route");

    const response = await PATCH(
      new NextRequest("http://localhost/api/novel/novel-1/wizard", {
        method: "PATCH",
        body: JSON.stringify({
          customConfigPartial: {
            worldbuilding: "月环殖民地",
          },
        }),
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(service.updateWizardDraft).toHaveBeenCalledWith({
      userId: "user-1",
      novelId: "novel-1",
      customConfigPartial: {
        worldbuilding: "月环殖民地",
      },
    });
  });

  it("POST /api/novel/[id]/wizard/suggest 返回建议结果", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.generateWizardSuggestion.mockResolvedValueOnce({
      field: "worldbuilding",
      suggestion: "建议使用被遗弃的轨道电梯遗址",
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/wizard/suggest/route")
    >("../app/api/novel/[id]/wizard/suggest/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/novel-1/wizard/suggest", {
        method: "POST",
        body: JSON.stringify({ questionId: "q4" }),
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      field: "worldbuilding",
      suggestion: "建议使用被遗弃的轨道电梯遗址",
    });
  });

  it("POST /api/novel/[id]/wizard/confirm-config 返回补齐后的配置", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.confirmWizardConfig.mockResolvedValueOnce({
      novelId: "novel-1",
      status: "draft",
      customConfig: {
        worldbuilding: "现实世界",
        perspective: "第三人称限制",
        tone: "轻松幽默",
        theme: "成长与蜕变",
        audience: "大众读者",
        chapterCount: 12,
      },
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/wizard/confirm-config/route")
    >("../app/api/novel/[id]/wizard/confirm-config/route");

    const response = await POST(
      new NextRequest(
        "http://localhost/api/novel/novel-1/wizard/confirm-config",
        {
          method: "POST",
        },
      ),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect((await response.json()).customConfig.chapterCount).toBe(12);
  });

  it("POST /api/novel/[id]/wizard/titles 返回候选标题数组", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.generateWizardTitles.mockResolvedValueOnce({
      candidateTitles: ["星轨回声", "失序轨道", "幽蓝坠点"],
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/wizard/titles/route")
    >("../app/api/novel/[id]/wizard/titles/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/novel-1/wizard/titles", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      candidateTitles: ["星轨回声", "失序轨道", "幽蓝坠点"],
    });
  });

  it("POST /api/novel/[id]/confirm-title 确认标题后进入 planning", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.confirmWizardTitle.mockResolvedValueOnce({
      novelId: "novel-1",
      status: "planning",
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/confirm-title/route")
    >("../app/api/novel/[id]/confirm-title/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/novel-1/confirm-title", {
        method: "POST",
        body: JSON.stringify({ title: "星轨回声" }),
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      novelId: "novel-1",
      status: "planning",
    });
  });

  it("GET /api/novel/[id]/plan 返回规划页数据", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.loadNovelPlan.mockResolvedValueOnce({
      outline: "# 大纲",
      characterProfiles: [{ name: "林岚", role: "主角", summary: "冷静" }],
      chapters: [
        {
          chapterNumber: 1,
          title: "失踪信号",
          outlineSummary: "核心事件: 发现异常信号",
        },
      ],
    });

    const { GET } = await loadModule<
      typeof import("../app/api/novel/[id]/plan/route")
    >("../app/api/novel/[id]/plan/route");

    const response = await GET(
      new NextRequest("http://localhost/api/novel/novel-1/plan"),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect((await response.json()).chapters[0].chapterNumber).toBe(1);
  });

  it("PUT /api/novel/[id]/plan 保存单章摘要", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.saveChapterOutlineSummary.mockResolvedValueOnce({
      success: true,
    });

    const { PUT } = await loadModule<
      typeof import("../app/api/novel/[id]/plan/route")
    >("../app/api/novel/[id]/plan/route");

    const response = await PUT(
      new NextRequest("http://localhost/api/novel/novel-1/plan", {
        method: "PUT",
        body: JSON.stringify({
          chapterNumber: 1,
          outlineSummary: "核心事件: 主角发现失踪信号并决定追查",
        }),
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
  });

  it("未登录访问路由时返回 401", async () => {
    authMock.mockResolvedValueOnce(null);

    const { POST } = await loadModule<
      typeof import("../app/api/novel/wizard/route")
    >("../app/api/novel/wizard/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/wizard", {
        method: "POST",
        body: JSON.stringify({ coreConfig: {} }),
      }),
    );

    expect(response.status).toBe(401);
  });
});
