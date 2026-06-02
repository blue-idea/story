import { describe, expect, it, beforeEach, vi } from "vitest";
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

  it("REQ-001-AC-003: 检测到进行中项目时展示续写卡片并跳转到写作页", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    loadHomeDashboardMock.mockResolvedValueOnce({
      preferences: {
        preferredGenres: ["Cyberpunk", "Thriller"],
        defaultTone: "Noir",
        defaultChapterCount: 24,
      },
      lastActiveNovel: {
        id: "novel-1",
        title: "Neon Meridian",
        status: "in_progress",
        continuePath: "/novel/novel-1/write",
        progressPercent: 68,
        lastEditedAt: new Date("2026-05-30T10:00:00.000Z"),
      },
    });

    const pageModule = await import("../app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(loadHomeDashboardMock).toHaveBeenCalledWith("user-1");
    expect(markup).toContain("继续创作");
    expect(markup).toContain("/novel/novel-1/write");
    expect(markup).toContain("Neon Meridian");
    expect(markup).toContain("已完成 68%");
    expect(markup).toContain("上次编辑于");
  });

  it("REQ-001-AC-002: 首页应展示偏好摘要与开启新小说按钮", async () => {
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
    });

    const pageModule = await import("../app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("偏好题材");
    expect(markup).toContain("Fantasy");
    expect(markup).toContain("开始新小说");
  });
});
