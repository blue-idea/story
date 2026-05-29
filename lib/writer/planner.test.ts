import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CoreConfig, CustomConfig } from "../../db/schema";
import { parseChaptersFromOutline } from "./parse-outline";
import {
  generateCandidateTitles,
  generateOutline,
  generateCharacterProfiles,
  runPhase2Planning,
  parseCandidateTitles,
} from "./planner";

const OUTLINE_FIXTURE = `# 测试小说 大纲

## 章节规划

| 章节 | 标题 | 核心事件 | 承接上章 | 章首引子类型 | 悬念钩子 | 出场人物 | 场景列表 |
|-----|------|---------|---------|-------------|---------|---------|---------|
| 第1章 | 家族惊变 | 林云发现家族被灭 | — | 悬念式 | 突然揭示 | 林云 | 林府 |
| 第2章 | 拜入宗门 | 通过外门考核 | 逃脱追杀 | 冲突式 | 紧急危机 | 林云,长老 | 剑宗 |

## 全书悬念线
- **主线悬念**：灭门真相
`;

const CHARACTERS_FIXTURE = `## 主角

### 林云
- **性格核心**：冷静果敢
- **致命缺陷**：过度自信

## 反派

### 黑衣人
- **性格核心**：冷酷
`;

const mockGenerateText = vi.fn();

vi.mock("../llm", () => ({
  createLLMClient: vi.fn(() => ({
    generateText: mockGenerateText,
  })),
}));

const coreConfig: CoreConfig = {
  genre: "玄幻",
  protagonist: "没落家族少爷林云",
  conflict: "查明灭门真相",
};

const customConfig: CustomConfig = {
  worldbuilding: "高武剑修世界",
  perspective: "第三人称限知",
  tone: "热血",
  theme: "复仇与成长",
  audience: "男频",
  chapterCount: 2,
};

describe("parseChaptersFromOutline", () => {
  it("从 7 列表格 fixture 解析章节号、标题与 outlineSummary", () => {
    const chapters = parseChaptersFromOutline(OUTLINE_FIXTURE);

    expect(chapters).toHaveLength(2);
    expect(chapters[0].chapterNumber).toBe(1);
    expect(chapters[0].title).toBe("家族惊变");
    expect(chapters[0].outlineSummary).toContain("核心事件");
    expect(chapters[0].outlineSummary).toContain("林云发现家族被灭");
    expect(chapters[0].outlineSummary).toContain("章首引子类型");
    expect(chapters[0].outlineSummary).toContain("悬念式");

    expect(chapters[1].chapterNumber).toBe(2);
    expect(chapters[1].title).toBe("拜入宗门");
    expect(chapters[1].outlineSummary).toContain("紧急危机");
  });
});

describe("parseCandidateTitles", () => {
  it("解析 phase1-title 编号列表", () => {
    const text = `1. 剑道通神 — 意境法 — 突出修炼主线
2. 万古第一神 — 夸张法 — 强调无敌
3. 绝世剑神 — 称号法 — 剑修身份`;
    expect(parseCandidateTitles(text)).toEqual([
      "剑道通神",
      "万古第一神",
      "绝世剑神",
    ]);
  });
});

describe("Planner (prompts + 两次 LLM)", () => {
  beforeEach(() => {
    mockGenerateText.mockReset();
  });

  it("generateCandidateTitles 使用 phase1-title 并解析候选标题", async () => {
    mockGenerateText.mockResolvedValueOnce(`1. 剑道通神 — 意境法 — 说明
2. 万古第一神 — 夸张法 — 说明`);

    const titles = await generateCandidateTitles({ coreConfig, customConfig });

    expect(titles).toEqual(["剑道通神", "万古第一神"]);
    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    const call = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain("玄幻");
    expect(call.prompt).toContain("没落家族少爷林云");
    expect(call.systemInstruction).toMatch(/编辑|策划/);
  });

  it("generateOutline 使用 phase2-outline 返回大纲正文", async () => {
    mockGenerateText.mockResolvedValueOnce(OUTLINE_FIXTURE);

    const outline = await generateOutline({
      coreConfig,
      customConfig,
      title: "剑道通神",
    });

    expect(outline).toContain("章节规划");
    expect(outline).toContain("第1章");
    const call = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain("剑道通神");
    expect(call.prompt).toContain("章节数：2");
  });

  it("generateCharacterProfiles 在 outline 之后调用 phase2-characters", async () => {
    mockGenerateText.mockResolvedValueOnce(CHARACTERS_FIXTURE);

    const profiles = await generateCharacterProfiles(
      { coreConfig, customConfig, title: "剑道通神" },
      OUTLINE_FIXTURE,
    );

    expect(profiles.length).toBeGreaterThanOrEqual(1);
    expect(profiles[0].name).toBe("林云");
    expect(profiles[0].role).toMatch(/主角/);
    expect(profiles[0].summary).toContain("性格核心");

    const call = mockGenerateText.mock.calls[0][0];
    expect(call.prompt).toContain("林云发现家族被灭");
  });

  it("runPhase2Planning 先 outline 再 characters，并解析 chapters", async () => {
    mockGenerateText
      .mockResolvedValueOnce(OUTLINE_FIXTURE)
      .mockResolvedValueOnce(CHARACTERS_FIXTURE);

    const result = await runPhase2Planning({
      coreConfig,
      customConfig,
      title: "剑道通神",
    });

    expect(mockGenerateText).toHaveBeenCalledTimes(2);
    expect(result.outline).toContain("全书悬念线");
    expect(result.characterProfiles[0].name).toBe("林云");
    expect(result.chapters).toHaveLength(2);
    expect(result.chapters[0].outlineSummary).toContain("突然揭示");
  });
});
