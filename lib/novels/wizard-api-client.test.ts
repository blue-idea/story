import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmWizardConfigRequest,
  confirmWizardTitleRequest,
  createWizardDraftRequest,
  requestWizardSuggestion,
  requestWizardTitles,
  updateWizardDraftRequest,
} from "./wizard-api-client";

describe("向导 API 客户端", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("REQ-002-AC-002c: confirm-config 应调用对应端点", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        novelId: "novel-1",
        status: "draft",
        customConfig: {
          worldbuilding: "Megacity",
          perspective: "Third person",
          tone: "Noir",
          theme: "Identity",
          audience: "General readers",
          chapterCount: 24,
        },
      }),
    });

    const result = await confirmWizardConfigRequest("novel-1");
    expect(result.status).toBe("draft");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/novel/novel-1/wizard/confirm-config",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("REQ-002-AC-003: confirm-title 应提交标题并返回 planning", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        novelId: "novel-1",
        status: "planning",
      }),
    });

    const result = await confirmWizardTitleRequest("novel-1", "Neon Meridian");
    expect(result.status).toBe("planning");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/novel/novel-1/confirm-title",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Neon Meridian" }),
      }),
    );
  });

  it("应支持创建草稿、增量更新、随机建议和生成标题", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ novelId: "novel-1", status: "draft" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          novelId: "novel-1",
          status: "draft",
          customConfig: { worldbuilding: "Orbital city" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ field: "theme", suggestion: "Power and memory" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidateTitles: ["A", "B", "C"] }),
      });

    await createWizardDraftRequest({
      genre: "Sci-Fi",
      protagonist: "Mira",
      conflict: "Find the lost archive",
    });
    await updateWizardDraftRequest("novel-1", {
      worldbuilding: "Orbital city",
    });
    await requestWizardSuggestion("novel-1", "q6");
    const titles = await requestWizardTitles("novel-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/novel/wizard",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/novel/novel-1/wizard",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/novel/novel-1/wizard/suggest",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/novel/novel-1/wizard/titles",
      expect.objectContaining({ method: "POST" }),
    );
    expect(titles.candidateTitles).toHaveLength(3);
  });
});
