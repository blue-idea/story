import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);

const authMock = vi.hoisted(() => vi.fn());
const loadNovelPlanMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  redirect: redirectMock,
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/novels/wizard-service", () => ({
  loadNovelPlan: loadNovelPlanMock,
}));

describe("TASK-015 大纲规划与人设调整确认页面", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("REQ-001-AC-001: 未登录访问 /novel/[id]/plan 时应跳转登录页", async () => {
    authMock.mockResolvedValueOnce(null);
    const pageModule = await import("../app/novel/[id]/plan/page");

    await expect(
      pageModule.default({
        params: Promise.resolve({ id: "novel-1" }),
      }),
    ).rejects.toThrow("REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("REQ-003-AC-001: 渲染大纲、人设、章节提纲卡，并包含编辑图标与炫酷确认按钮样式", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    loadNovelPlanMock.mockResolvedValueOnce({
      outline: "# Outline\n\nSignal returns.",
      characterProfiles: [
        { name: "Lin Xia", role: "Lead", summary: "Investigative reporter." },
      ],
      chapters: [
        {
          chapterNumber: 1,
          title: "Rain Signal",
          outlineSummary:
            "章节定位: 开端 | 核心事件: 找到广播塔入口 | 冲突升级: 备份被删 | 章节悬念: 录音出现旧声纹",
        },
      ],
    });

    const pageModule = await import("../app/novel/[id]/plan/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        params: Promise.resolve({ id: "novel-1" }),
      }),
    );

    expect(loadNovelPlanMock).toHaveBeenCalledWith({
      userId: "user-1",
      novelId: "novel-1",
    });
    expect(markup).toContain("Outline review before automatic writing.");
    expect(markup).toContain("# Outline");
    expect(markup).toContain("Lin Xia");
    expect(markup).toContain("Rain Signal");
    expect(markup).toContain("Edit Outline");
    expect(markup).toContain("Confirm and Write");
    expect(markup).toContain("plan-text-button-icon");
    expect(markup).toContain("plan-primary-button-glow");
  });

  it("REQ-003-AC-003: QA 预览页可直达写作预览入口", async () => {
    const qaModule = await import("../app/qa/task-015/page");
    const markup = renderToStaticMarkup(qaModule.default());

    expect(markup).toContain("Confirm and Write");
    expect(markup).toContain("Beat-by-beat chapter cards");
  });
});
