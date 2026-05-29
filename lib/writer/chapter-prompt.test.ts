import { describe, it, expect } from "vitest";
import { buildChapterDraftPrompt } from "./chapter-prompt";

describe("chapter-prompt", () => {
  it("buildChapterDraftPrompt 注入 7 列规划、人物与上文", () => {
    const { prompt, systemInstruction } = buildChapterDraftPrompt({
      chapterNumber: 1,
      chapterTitle: "启程",
      outlineRow: "章节: 第1章 | 标题: 启程 | 悬念钩子: 突然揭示",
      characterProfiles: [{ name: "林云", role: "主角", summary: "冷静侦探" }],
      previousChapterSummary: "（首章无上文）",
    });

    expect(prompt).toContain("启程");
    expect(prompt).toContain("突然揭示");
    expect(prompt).toContain("林云");
    expect(prompt).toContain("3000");
    expect(prompt).toContain("悬念");
    expect(systemInstruction).toMatch(/作者|创作/);
  });
});
