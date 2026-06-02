import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db", () => ({
  db: {
    query: {
      userPreferences: {
        findFirst: vi.fn(),
      },
      novels: {
        findMany: vi.fn(),
      },
    },
  },
}));

import { db } from "../../db";
import { loadHomeDashboard } from "./home-service";

describe("home-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("应为全部作品生成状态对应的入口动作", async () => {
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValueOnce({
      id: "pref-1",
      userId: "user-1",
      preferences: {
        preferredGenres: ["Sci-Fi"],
        defaultTone: "Noir",
        defaultChapterCount: 24,
      },
      createdAt: new Date("2026-06-01T10:00:00.000Z"),
      updatedAt: new Date("2026-06-01T10:00:00.000Z"),
    });
    vi.mocked(db.query.novels.findMany).mockResolvedValueOnce([
      {
        id: "novel-draft",
        userId: "user-1",
        title: "Draft Atlas",
        status: "draft",
        coreConfig: { genre: "Sci-Fi", protagonist: "A", conflict: "B" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 12,
        },
        createdAt: new Date("2026-06-03T08:00:00.000Z"),
        updatedAt: new Date("2026-06-03T08:00:00.000Z"),
      },
      {
        id: "novel-writing",
        userId: "user-1",
        title: "Signal Run",
        status: "in_progress",
        coreConfig: { genre: "Sci-Fi", protagonist: "A", conflict: "B" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 12,
        },
        createdAt: new Date("2026-06-02T08:00:00.000Z"),
        updatedAt: new Date("2026-06-02T08:00:00.000Z"),
      },
      {
        id: "novel-complete",
        userId: "user-1",
        title: "Last Archive",
        status: "completed",
        coreConfig: { genre: "Sci-Fi", protagonist: "A", conflict: "B" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 12,
        },
        createdAt: new Date("2026-06-01T08:00:00.000Z"),
        updatedAt: new Date("2026-06-01T08:00:00.000Z"),
      },
      {
        id: "novel-failed",
        userId: "user-1",
        title: "Broken Orbit",
        status: "failed",
        coreConfig: { genre: "Sci-Fi", protagonist: "A", conflict: "B" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 12,
        },
        createdAt: new Date("2026-05-31T08:00:00.000Z"),
        updatedAt: new Date("2026-05-31T08:00:00.000Z"),
      },
    ]);

    const dashboard = await loadHomeDashboard("user-1");

    expect(dashboard.preferences.preferredGenres).toEqual(["Sci-Fi"]);
    expect(dashboard.works).toHaveLength(4);
    expect(dashboard.works[0]).toMatchObject({
      id: "novel-draft",
      primaryActionLabel: "Edit",
      primaryActionHref: "/novel/novel-draft/plan",
    });
    expect(dashboard.works[1]).toMatchObject({
      id: "novel-writing",
      primaryActionLabel: "Continue Writing",
      primaryActionHref: "/novel/novel-writing/write",
    });
    expect(dashboard.works[2]).toMatchObject({
      id: "novel-complete",
      primaryActionLabel: "Read",
      primaryActionHref: "/novel/novel-complete/read",
    });
    expect(dashboard.works[3]).toMatchObject({
      id: "novel-failed",
      primaryActionLabel: "Continue Writing",
      primaryActionHref: "/novel/novel-failed/write",
    });
  });

  it("应从作品列表中推导最近活跃作品并回退默认偏好", async () => {
    vi.mocked(db.query.userPreferences.findFirst).mockResolvedValueOnce(
      undefined,
    );
    vi.mocked(db.query.novels.findMany).mockResolvedValueOnce([
      {
        id: "novel-1",
        userId: "user-1",
        title: "Plan First",
        status: "planning",
        coreConfig: { genre: "Sci-Fi", protagonist: "A", conflict: "B" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 12,
        },
        createdAt: new Date("2026-06-03T08:00:00.000Z"),
        updatedAt: new Date("2026-06-03T08:00:00.000Z"),
      },
      {
        id: "novel-2",
        userId: "user-1",
        title: "Archive",
        status: "completed",
        coreConfig: { genre: "Sci-Fi", protagonist: "A", conflict: "B" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 12,
        },
        createdAt: new Date("2026-06-02T08:00:00.000Z"),
        updatedAt: new Date("2026-06-02T08:00:00.000Z"),
      },
    ]);

    const dashboard = await loadHomeDashboard("user-1");

    expect(dashboard.preferences).toEqual({
      preferredGenres: [],
      defaultTone: null,
      defaultChapterCount: null,
    });
    expect(dashboard.lastActiveNovel).toMatchObject({
      id: "novel-1",
      title: "Plan First",
      continuePath: "/novel/novel-1/plan",
      progressPercent: 32,
    });
  });
});
