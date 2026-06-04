import { describe, expect, it } from "vitest";

import {
  buildNarrativeContext,
  type CompletedChapterMemory,
} from "./context-memory";

describe("context-memory", () => {
  it("按章节出场人物过滤角色，并为限制视角生成边界说明", () => {
    const context = buildNarrativeContext({
      outlineRow:
        "章节: 第2章 | 标题: 追索 | 核心事件: 深夜潜入 | 出场人物: 林云、苏离 | 场景列表: 档案馆",
      characterProfiles: [
        { name: "林云", role: "主角", summary: "冷静克制的调查者" },
        { name: "苏离", role: "搭档", summary: "谨慎细致的情报员" },
        { name: "顾沉", role: "反派", summary: "尚未正式登场" },
      ],
      perspective: "第三人称限制",
      protagonist: "林云",
      completedChapters: [],
    });

    expect(context.selectedProfiles).toHaveLength(2);
    expect(context.selectedProfiles.map((profile) => profile.name)).toEqual([
      "林云",
      "苏离",
    ]);
    expect(context.perspectiveBoundary).toContain("林云");
    expect(context.perspectiveBoundary).toContain(
      "只能描写该角色直接所见所闻所想",
    );
  });

  it("为后续章节拼接滚动摘要链与上一章结尾片段", () => {
    const completedChapters: CompletedChapterMemory[] = [
      {
        chapterNumber: 1,
        title: "异响",
        chapterSummary: "林云在广播塔内发现失踪案的第一条物证。",
        content:
          "林云推开锈门，冷风卷入塔楼。\n\n他在控制台下摸到一枚染血的徽章，耳边却突然响起不属于这座城市的呼吸声。",
      },
    ];

    const context = buildNarrativeContext({
      outlineRow:
        "章节: 第2章 | 标题: 追索 | 核心事件: 深夜潜入 | 出场人物: 林云、苏离 | 场景列表: 档案馆",
      characterProfiles: [{ name: "林云", role: "主角", summary: "冷静克制" }],
      perspective: "第一人称",
      protagonist: "林云",
      completedChapters,
    });

    expect(context.summaryTimeline).toContain("第1章《异响》");
    expect(context.summaryTimeline).toContain("第一条物证");
    expect(context.previousExcerpt).toContain("染血的徽章");
    expect(context.previousExcerpt).toContain("呼吸声");
  });
});
