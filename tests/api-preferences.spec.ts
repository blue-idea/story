import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/preferences/route";
import { db } from "../db";

vi.mock("../lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("../db", () => {
  const dbMock = {
    query: {
      userPreferences: {
        findFirst: vi.fn(),
      },
      novels: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn(),
  };
  return { db: dbMock };
});

import { auth } from "../lib/auth";

describe("Preferences API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/preferences", () => {
    it("返回 401 如果未登录", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/preferences");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it("返回用户偏好以及最新进行中的小说", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", name: "Test" },
        expires: "9999-12-31T23:59:59.999Z",
      });

      // 模拟 db 返回 preferences
      vi.mocked(db.query.userPreferences.findFirst).mockResolvedValueOnce({
        id: "pref-1",
        userId: "user-1",
        preferences: {
          preferredGenres: ["玄幻"],
          defaultTone: "轻松",
          defaultChapterCount: 100,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 模拟 db 返回 in_progress小说
      vi.mocked(db.query.novels.findFirst).mockResolvedValueOnce({
        id: "novel-1",
        userId: "user-1",
        title: "测试小说",
        status: "in_progress",
        coreConfig: { genre: "玄幻", protagonist: "张三", conflict: "复仇" },
        customConfig: {
          worldbuilding: "",
          perspective: "",
          tone: "",
          theme: "",
          audience: "",
          chapterCount: 100,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new NextRequest("http://localhost/api/preferences");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.preferences).toEqual({
        preferredGenres: ["玄幻"],
        defaultTone: "轻松",
        defaultChapterCount: 100,
      });
      expect(body.lastActiveNovel).toBeDefined();
      expect(body.lastActiveNovel.id).toBe("novel-1");
      expect(body.lastActiveNovel.title).toBe("测试小说");
    });

    it("如果没有偏好记录，返回默认偏好结构", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", name: "Test" },
        expires: "9999-12-31T23:59:59.999Z",
      });

      vi.mocked(db.query.userPreferences.findFirst).mockResolvedValueOnce(
        undefined,
      );
      vi.mocked(db.query.novels.findFirst).mockResolvedValueOnce(undefined);

      const req = new NextRequest("http://localhost/api/preferences");
      const res = await GET(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.preferences).toEqual({
        preferredGenres: [],
        defaultTone: null,
        defaultChapterCount: null,
      });
      expect(body.lastActiveNovel).toBeNull();
    });
  });

  describe("POST /api/preferences", () => {
    it("返回 401 如果未登录", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);
      const req = new NextRequest("http://localhost/api/preferences", {
        method: "POST",
        body: JSON.stringify({ preferredGenres: ["科幻"] }),
      });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("保存或更新偏好设置", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "user-1", name: "Test" },
        expires: "9999-12-31T23:59:59.999Z",
      });

      const payload = {
        preferredGenres: ["科幻", "悬疑"],
        defaultTone: "暗黑",
        defaultChapterCount: 50,
      };

      const req = new NextRequest("http://localhost/api/preferences", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);

      expect(db.insert).toHaveBeenCalled();
      // 这里可以做更多断言，确保 onConflictDoUpdate 被调用
    });
  });
});
