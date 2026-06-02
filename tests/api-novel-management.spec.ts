import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());

const service = vi.hoisted(() => ({
  deleteNovel: vi.fn(),
  NotFoundError: class NotFoundError extends Error {},
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/novels/management-service", () => service);

async function loadModule<T>(path: string): Promise<T> {
  return import(path) as Promise<T>;
}

describe("TASK-020 novel management routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-007-AC-005: DELETE /api/novel/[id] 删除本人作品", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.deleteNovel.mockResolvedValueOnce({
      success: true,
      deletedNovelId: "novel-1",
    });

    const { DELETE } = await loadModule<
      typeof import("../app/api/novel/[id]/route")
    >("../app/api/novel/[id]/route");

    const response = await DELETE(
      new NextRequest("http://localhost/api/novel/novel-1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      deletedNovelId: "novel-1",
    });
    expect(service.deleteNovel).toHaveBeenCalledWith({
      userId: "user-1",
      novelId: "novel-1",
    });
  });

  it("未登录删除作品时返回 401", async () => {
    authMock.mockResolvedValueOnce(null);

    const { DELETE } = await loadModule<
      typeof import("../app/api/novel/[id]/route")
    >("../app/api/novel/[id]/route");

    const response = await DELETE(
      new NextRequest("http://localhost/api/novel/novel-1", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("REQ-007-AC-006: 删除非本人作品时返回 404", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-2" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.deleteNovel.mockRejectedValueOnce(
      new service.NotFoundError("Novel not found"),
    );

    const { DELETE } = await loadModule<
      typeof import("../app/api/novel/[id]/route")
    >("../app/api/novel/[id]/route");

    const response = await DELETE(
      new NextRequest("http://localhost/api/novel/novel-owner-a", {
        method: "DELETE",
      }),
      {
        params: Promise.resolve({ id: "novel-owner-a" }),
      },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "Novel not found",
    });
  });
});
