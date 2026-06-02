import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { HomeDashboard } from "../components/home/home-dashboard";

describe("TASK-020 首页作品管理列表与删除能力", () => {
  it("REQ-007-AC-001/002/003/004: 首页应渲染全部作品与对应状态入口", () => {
    const markup = renderToStaticMarkup(
      createElement(HomeDashboard, {
        dashboard: {
          preferences: {
            preferredGenres: ["Sci-Fi", "Thriller"],
            defaultTone: "Noir",
            defaultChapterCount: 18,
          },
          lastActiveNovel: {
            id: "novel-planning",
            title: "Orbit Draft",
            status: "planning",
            continuePath: "/novel/novel-planning/plan",
            progressPercent: 32,
            lastEditedAt: "2026-06-03T10:00:00.000Z",
          },
          works: [
            {
              id: "novel-draft",
              title: "Draft One",
              status: "draft",
              updatedAt: "2026-06-03T12:00:00.000Z",
              primaryActionLabel: "Edit",
              primaryActionHref: "/novel/novel-draft/plan",
            },
            {
              id: "novel-writing",
              title: "Writing One",
              status: "in_progress",
              updatedAt: "2026-06-03T11:00:00.000Z",
              primaryActionLabel: "Continue Writing",
              primaryActionHref: "/novel/novel-writing/write",
            },
            {
              id: "novel-complete",
              title: "Read One",
              status: "completed",
              updatedAt: "2026-06-03T10:00:00.000Z",
              primaryActionLabel: "Read",
              primaryActionHref: "/novel/novel-complete/read",
            },
          ],
        },
      }),
    );

    expect(markup).toContain("作品库");
    expect(markup).toContain("Draft One");
    expect(markup).toContain("Writing One");
    expect(markup).toContain("Read One");
    expect(markup).toContain("/novel/novel-draft/plan");
    expect(markup).toContain("/novel/novel-writing/write");
    expect(markup).toContain("/novel/novel-complete/read");
    expect(markup).toContain("编辑");
    expect(markup).toContain("继续写作");
    expect(markup).toContain("阅读");
    expect(markup).toContain("删除");
  });
});
