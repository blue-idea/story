import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

const authMock = vi.hoisted(() => vi.fn());
const loadHomeDashboardMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/home/home-service", () => ({
  loadHomeDashboard: loadHomeDashboardMock,
}));

describe("TASK-013 首页与快捷续写卡片 UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("REQ-001-AC-001: 未登录访问首页时跳转到登录页", async () => {
    authMock.mockResolvedValueOnce(null);
    const pageModule = await import("../app/page");

    await expect(pageModule.default()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("REQ-001-AC-003: 检测到活跃作品时应展示继续卡片", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    loadHomeDashboardMock.mockResolvedValueOnce({
      preferences: {
        preferredGenres: ["Sci-Fi", "Thriller"],
        defaultTone: "Noir",
        defaultChapterCount: 24,
      },
      lastActiveNovel: {
        id: "novel-1",
        title: "Neon Meridian",
        status: "in_progress",
        continuePath: "/novel/novel-1/write",
        progressPercent: 68,
        lastEditedAt: "2026-05-30T10:00:00.000Z",
      },
      works: [
        {
          id: "novel-1",
          title: "Neon Meridian",
          status: "in_progress",
          updatedAt: "2026-05-30T10:00:00.000Z",
          primaryActionLabel: "Continue Writing",
          primaryActionHref: "/novel/novel-1/write",
        },
      ],
    });

    const pageModule = await import("../app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(loadHomeDashboardMock).toHaveBeenCalledWith("user-1");
    expect(markup).toContain("继续创作");
    expect(markup).toContain("/novel/novel-1/write");
    expect(markup).toContain("Neon Meridian");
    expect(markup).toContain("已完成 68%");
  });

  it("REQ-001-AC-002: 首页应展示偏好摘要与新建入口", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-2" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    loadHomeDashboardMock.mockResolvedValueOnce({
      preferences: {
        preferredGenres: ["Fantasy"],
        defaultTone: "Hopeful",
        defaultChapterCount: 12,
      },
      lastActiveNovel: null,
      works: [],
    });

    const pageModule = await import("../app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("偏好题材");
    expect(markup).toContain("Fantasy");
    expect(markup).toContain("开始创作新小说");
    expect(markup).toContain("无活跃作品");
  });
});
