import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => vi.fn());

const service = vi.hoisted(() => ({
  startNovelWriting: vi.fn(),
  streamNovelWriting: vi.fn(),
  ValidationError: class ValidationError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
}));

vi.mock("../lib/auth", () => ({
  auth: authMock,
}));

vi.mock("../lib/novels/writing-service", () => service);

async function loadModule<T>(path: string): Promise<T> {
  return import(path) as Promise<T>;
}

describe("TASK-011 routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/novel/[id]/start-writing 启动写作并返回 in_progress", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.startNovelWriting.mockResolvedValueOnce({
      novelId: "novel-1",
      status: "in_progress",
    });

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/start-writing/route")
    >("../app/api/novel/[id]/start-writing/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/novel-1/start-writing", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      novelId: "novel-1",
      status: "in_progress",
    });
    expect(service.startNovelWriting).toHaveBeenCalledWith({
      userId: "user-1",
      novelId: "novel-1",
    });
  });

  it("GET /api/novel/[id]/write/stream 返回 SSE 响应", async () => {
    authMock.mockResolvedValueOnce({
      user: { id: "user-1" },
      expires: "9999-12-31T23:59:59.999Z",
    });
    service.streamNovelWriting.mockResolvedValueOnce(
      new Response('event: chapter_start\ndata: {"chapterNumber":1}\n\n', {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
        },
      }),
    );

    const { GET } = await loadModule<
      typeof import("../app/api/novel/[id]/write/stream/route")
    >("../app/api/novel/[id]/write/stream/route");

    const response = await GET(
      new NextRequest("http://localhost/api/novel/novel-1/write/stream"),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(await response.text()).toContain("event: chapter_start");
  });

  it("未登录访问 start-writing 时返回 401", async () => {
    authMock.mockResolvedValueOnce(null);

    const { POST } = await loadModule<
      typeof import("../app/api/novel/[id]/start-writing/route")
    >("../app/api/novel/[id]/start-writing/route");

    const response = await POST(
      new NextRequest("http://localhost/api/novel/novel-1/start-writing", {
        method: "POST",
      }),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("未登录访问 write/stream 时返回 401", async () => {
    authMock.mockResolvedValueOnce(null);

    const { GET } = await loadModule<
      typeof import("../app/api/novel/[id]/write/stream/route")
    >("../app/api/novel/[id]/write/stream/route");

    const response = await GET(
      new NextRequest("http://localhost/api/novel/novel-1/write/stream"),
      {
        params: Promise.resolve({ id: "novel-1" }),
      },
    );

    expect(response.status).toBe(401);
  });
});
