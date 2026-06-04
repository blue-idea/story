import { describe, expect, it } from "vitest";

import {
  buildChapterDraftPrompt,
  buildChapterRewritePrompt,
} from "./chapter-prompt";

describe("chapter-prompt", () => {
  it("注入角色、滚动摘要和视角边界约束", () => {
    const { prompt, systemInstruction } = buildChapterDraftPrompt({
      chapterNumber: 1,
      chapterTitle: "启程",
      outlineRow: "章节: 第1章 | 标题: 启程 | 悬念钩子: 突然揭示",
      selectedProfiles: [{ name: "林云", role: "主角", summary: "冷静侦探" }],
      summaryTimeline: "（首章暂无已完成章节摘要）",
      previousExcerpt: "（首章无上文结尾片段）",
      perspectiveBoundary:
        "本章采用第一人称视角，视角主人为林云，只能描写该角色直接所见所闻所想。",
    });

    expect(prompt).toContain("启程");
    expect(prompt).toContain("突然揭示");
    expect(prompt).toContain("林云");
    expect(prompt).toContain("第一人称视角");
    expect(prompt).toContain("已完成章节摘要");
    expect(prompt).toContain("首章暂无已完成章节摘要");
    expect(prompt).toContain("3000");
    expect(prompt).toContain("8000");
    expect(prompt).toContain("悬念");
    expect(systemInstruction).toMatch(/作者|创作/);
  });

  it("重写 prompt 也保留视角边界和前情摘要", () => {
    const { prompt } = buildChapterRewritePrompt({
      chapterNumber: 3,
      chapterTitle: "回声",
      outlineRow: "章节: 第3章 | 标题: 回声 | 悬念钩子: 身份暴露",
      selectedProfiles: [{ name: "苏离", role: "搭档", summary: "敏锐果断" }],
      summaryTimeline: "第1章《异响》：林云发现物证。",
      previousExcerpt: "铁门外传来极轻的一声咳嗽。",
      perspectiveBoundary:
        "本章采用第三人称限制视角，视角主人为苏离，只能描写该角色直接所见所闻所想。",
      diagnosticLog: "当前版本缺少有效悬念。",
    });

    expect(prompt).toContain("苏离");
    expect(prompt).toContain("第三人称限制视角");
    expect(prompt).toContain("已完成章节摘要");
    expect(prompt).toContain("铁门外传来极轻的一声咳嗽");
    expect(prompt).toContain("当前版本缺少有效悬念");
  });
});
