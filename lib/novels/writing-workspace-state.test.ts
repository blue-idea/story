import { describe, expect, it } from "vitest";

import {
  applyWritingEvent,
  createWritingWorkspaceState,
  resetWorkspaceError,
} from "./writing-workspace-state";

describe("writing-workspace-state", () => {
  it("chapter_start 和 content_chunk 会更新活动章节和正文累加", () => {
    const state = createWritingWorkspaceState({
      title: "The Last Signal",
      novelStatus: "in_progress",
      chapters: [
        {
          chapterNumber: 1,
          title: "雨夜信号",
          outlineSummary: "核心事件: 林夏锁定广播塔",
          status: "pending",
          content: "",
          retryCount: 0,
          passed: false,
          wordCountValid: false,
          suspenseValid: false,
          validationLog: null,
        },
      ],
    });

    const started = applyWritingEvent(state, "chapter_start", {
      chapterNumber: 1,
      status: "writing",
    });
    const updated = applyWritingEvent(started, "content_chunk", {
      chapterNumber: 1,
      chunk: "Signal one.",
    });

    expect(updated.activeChapterNumber).toBe(1);
    expect(updated.chapters[0]?.status).toBe("writing");
    expect(updated.chapters[0]?.content).toBe("Signal one.");
    expect(updated.terminalEntries.at(-1)?.message).toContain(
      "第 1 章创作开始。",
    );
  });

  it("validation_result 和 error 会写入校验状态并激活重试按钮", () => {
    const state = createWritingWorkspaceState({
      title: "The Last Signal",
      novelStatus: "in_progress",
      chapters: [
        {
          chapterNumber: 2,
          title: "封存档案",
          outlineSummary: "核心事件: 潜入档案室",
          status: "writing",
          content: "Draft body",
          retryCount: 0,
          passed: false,
          wordCountValid: false,
          suspenseValid: false,
          validationLog: null,
        },
      ],
    });

    const validated = applyWritingEvent(state, "validation_result", {
      chapterNumber: 2,
      passed: false,
      wordCountValid: false,
      suspenseValid: true,
      retryCount: 2,
      diagnosticLog: "Need a stronger bridge scene.",
    });
    const failed = applyWritingEvent(validated, "error", {
      chapterNumber: 2,
      status: "failed",
      message: "Upstream provider timeout",
    });

    expect(failed.chapters[0]?.retryCount).toBe(2);
    expect(failed.chapters[0]?.validationLog).toBe(
      "Need a stronger bridge scene.",
    );
    expect(failed.errorMessage).toBe("Upstream provider timeout");
    expect(failed.canRetry).toBe(true);
    expect(failed.novelStatus).toBe("failed");
  });

  it("resetWorkspaceError 会清理故障状态并恢复为 in_progress", () => {
    const state = createWritingWorkspaceState({
      title: "The Last Signal",
      novelStatus: "failed",
      chapters: [
        {
          chapterNumber: 2,
          title: "封存档案",
          outlineSummary: "核心事件: 潜入档案室",
          status: "failed",
          content: "Draft body",
          retryCount: 2,
          passed: false,
          wordCountValid: false,
          suspenseValid: false,
          validationLog: "Need a stronger bridge scene.",
        },
      ],
    });

    const resumed = resetWorkspaceError(state);

    expect(resumed.errorMessage).toBeNull();
    expect(resumed.canRetry).toBe(false);
    expect(resumed.novelStatus).toBe("in_progress");
    expect(resumed.terminalEntries.at(-1)?.message).toContain("已请求重试");
  });
});
