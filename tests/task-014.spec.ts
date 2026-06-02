import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

const authMock = vi.hoisted(() => vi.fn());
const pushMock = vi.hoisted(() => vi.fn());
const getUserPreferencesMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/novels/repository", () => ({
  getUserPreferences: getUserPreferencesMock,
}));

describe("TASK-014 渐进式披露向导 UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("REQ-001-AC-001: 未登录访问新建向导时应跳转登录页", async () => {
    authMock.mockResolvedValueOnce(null);
    const pageModule = await import("../app/novel/new/page");

    await expect(pageModule.default()).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("REQ-002-AC-001: 新建向导首屏应只展示 Layer1 当前问题", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "11111111-1111-4111-8111-111111111111" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    getUserPreferencesMock.mockResolvedValueOnce({
      preferredGenres: ["科幻未来"],
      defaultTone: "轻松幽默",
      defaultChapterCount: 20,
    });

    const pageModule = await import("../app/novel/new/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("问题 1 / 3");
    expect(markup).toContain("你想要创作什么题材的小说？");
    expect(markup).toContain("悬疑推理（侦探、破案、解谜）");
    expect(markup).toContain("⭐自由描述（我有明确的想法，让我自己说）");
    expect(markup).not.toContain("第二阶段");
    expect(markup).not.toContain("候选标题");
  });

  it("应提供 TASK-014 的 QA 预览页用于视觉回归", async () => {
    const qaModule = await import("../app/qa/task-014/page");
    const markup = renderToStaticMarkup(await qaModule.default());

    expect(markup).toContain("小说创作向导");
    expect(markup).toContain("问题 1 / 3");
    expect(markup).toContain("科幻未来（科技、太空、末世）");
  });
});
