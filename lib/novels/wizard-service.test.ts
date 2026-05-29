import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CharacterProfile,
  CoreConfig,
  CustomConfig,
  NovelStatus,
  UserPreferencesPayload,
} from "../../db/schema";

const repository = vi.hoisted(() => ({
  createNovelDraft: vi.fn(),
  findOwnedNovel: vi.fn(),
  getUserPreferences: vi.fn(),
  updateNovelCustomConfig: vi.fn(),
  updateNovelTitleAndStatus: vi.fn(),
  saveNovelPlan: vi.fn(),
  getNovelPlan: vi.fn(),
  updateChapterOutline: vi.fn(),
}));

const planner = vi.hoisted(() => ({
  generateCandidateTitles: vi.fn(),
  runPhase2Planning: vi.fn(),
}));

const prompts = vi.hoisted(() => ({
  getSystem: vi.fn(() => "editor-system"),
  renderInstruction: vi.fn(() => "rendered-prompt"),
}));

const llm = vi.hoisted(() => ({
  generateText: vi.fn(),
}));

vi.mock("./repository", () => repository);
vi.mock("../writer/planner", () => planner);
vi.mock("../prompts", () => prompts);
vi.mock("../llm", () => ({
  createLLMClient: vi.fn(() => llm),
}));

const coreConfig: CoreConfig = {
  genre: "科幻",
  protagonist: "女调查员",
  conflict: "追查失踪真相",
};

const baseCustomConfig: CustomConfig = {
  worldbuilding: "近未来都市",
  perspective: "第三人称限制",
  tone: "紧张刺激",
  theme: "成长与蜕变",
  audience: "大众读者",
  chapterCount: 20,
};

const preferences: UserPreferencesPayload = {
  preferredGenres: ["科幻"],
  defaultTone: "轻松幽默",
  defaultChapterCount: 12,
};

const ownedNovel = {
  id: "novel-1",
  userId: "user-1",
  title: "Untitled Draft",
  status: "draft" as NovelStatus,
  coreConfig,
  customConfig: baseCustomConfig,
};

const planResult = {
  outline: "# 大纲",
  characterProfiles: [
    {
      name: "林岚",
      role: "主角",
      summary: "冷静而执拗",
    } satisfies CharacterProfile,
  ],
  chapters: [
    {
      chapterNumber: 1,
      title: "失踪信号",
      outlineSummary: "核心事件: 发现异常信号",
    },
  ],
};

async function loadService() {
  return import("./wizard-service");
}

describe("wizard-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("创建草稿时使用 Layer1 配置和偏好默认值", async () => {
    repository.getUserPreferences.mockResolvedValueOnce(preferences);
    repository.createNovelDraft.mockResolvedValueOnce({
      ...ownedNovel,
      customConfig: {
        ...baseCustomConfig,
        tone: "轻松幽默",
        chapterCount: 12,
      },
    });

    const { createWizardDraft } = await loadService();
    const result = await createWizardDraft({
      userId: "user-1",
      coreConfig,
    });

    expect(repository.createNovelDraft).toHaveBeenCalledWith({
      userId: "user-1",
      title: "Untitled Draft",
      coreConfig,
      customConfig: {
        worldbuilding: "现实世界",
        perspective: "第三人称限制",
        tone: "轻松幽默",
        theme: "成长与蜕变",
        audience: "大众读者",
        chapterCount: 12,
      },
    });
    expect(result.status).toBe("draft");
  });

  it("增量更新时只合并提交的 custom_config 字段", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    repository.updateNovelCustomConfig.mockResolvedValueOnce({
      ...ownedNovel,
      customConfig: {
        ...baseCustomConfig,
        worldbuilding: "月环殖民地",
      },
    });

    const { updateWizardDraft } = await loadService();
    const result = await updateWizardDraft({
      userId: "user-1",
      novelId: "novel-1",
      customConfigPartial: {
        worldbuilding: "月环殖民地",
      },
    });

    expect(repository.updateNovelCustomConfig).toHaveBeenCalledWith("novel-1", {
      ...baseCustomConfig,
      worldbuilding: "月环殖民地",
    });
    expect(result.customConfig.worldbuilding).toBe("月环殖民地");
  });

  it("单题建议接口返回字段映射和 LLM 建议文本", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    llm.generateText.mockResolvedValueOnce("建议使用被遗弃的轨道电梯遗址");

    const { generateWizardSuggestion } = await loadService();
    const result = await generateWizardSuggestion({
      userId: "user-1",
      novelId: "novel-1",
      questionId: "q4",
    });

    expect(prompts.renderInstruction).toHaveBeenCalled();
    expect(result).toEqual({
      field: "worldbuilding",
      suggestion: "建议使用被遗弃的轨道电梯遗址",
    });
  });

  it("确认配置时补齐缺失字段默认值", async () => {
    repository.getUserPreferences.mockResolvedValueOnce(preferences);
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...ownedNovel,
      customConfig: {
        ...baseCustomConfig,
        worldbuilding: "",
        tone: "",
        chapterCount: 0,
      },
    });
    repository.updateNovelCustomConfig.mockResolvedValueOnce({
      ...ownedNovel,
      customConfig: {
        ...baseCustomConfig,
        worldbuilding: "现实世界",
        tone: "轻松幽默",
        chapterCount: 12,
      },
    });

    const { confirmWizardConfig } = await loadService();
    const result = await confirmWizardConfig({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(repository.updateNovelCustomConfig).toHaveBeenCalledWith("novel-1", {
      worldbuilding: "现实世界",
      perspective: "第三人称限制",
      tone: "轻松幽默",
      theme: "成长与蜕变",
      audience: "大众读者",
      chapterCount: 12,
    });
    expect(result.customConfig.chapterCount).toBe(12);
  });

  it("生成标题时复用已有 draft 的完整配置", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    planner.generateCandidateTitles.mockResolvedValueOnce([
      "星轨回声",
      "失序轨道",
      "幽蓝坠点",
    ]);

    const { generateWizardTitles } = await loadService();
    const result = await generateWizardTitles({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(planner.generateCandidateTitles).toHaveBeenCalledWith({
      coreConfig,
      customConfig: baseCustomConfig,
    });
    expect(result.candidateTitles).toHaveLength(3);
  });

  it("确认标题时写入 planning 状态并保存规划结果", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce(ownedNovel);
    planner.runPhase2Planning.mockResolvedValueOnce(planResult);
    repository.updateNovelTitleAndStatus.mockResolvedValueOnce({
      ...ownedNovel,
      title: "星轨回声",
      status: "planning" as NovelStatus,
    });

    const { confirmWizardTitle } = await loadService();
    const result = await confirmWizardTitle({
      userId: "user-1",
      novelId: "novel-1",
      title: "星轨回声",
    });

    expect(repository.updateNovelTitleAndStatus).toHaveBeenCalledWith(
      "novel-1",
      "星轨回声",
      "planning",
    );
    expect(planner.runPhase2Planning).toHaveBeenCalledWith({
      coreConfig,
      customConfig: baseCustomConfig,
      title: "星轨回声",
    });
    expect(repository.saveNovelPlan).toHaveBeenCalledWith(
      "novel-1",
      planResult,
    );
    expect(result.status).toBe("planning");
  });

  it("获取规划页数据时返回大纲、人设和章节列表", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...ownedNovel,
      status: "planning" as NovelStatus,
    });
    repository.getNovelPlan.mockResolvedValueOnce(planResult);

    const { loadNovelPlan } = await loadService();
    const result = await loadNovelPlan({
      userId: "user-1",
      novelId: "novel-1",
    });

    expect(result.outline).toBe("# 大纲");
    expect(result.characterProfiles[0]?.name).toBe("林岚");
    expect(result.chapters[0]?.chapterNumber).toBe(1);
  });

  it("保存章节摘要时更新对应章节", async () => {
    repository.findOwnedNovel.mockResolvedValueOnce({
      ...ownedNovel,
      status: "planning" as NovelStatus,
    });
    repository.updateChapterOutline.mockResolvedValueOnce(true);

    const { saveChapterOutlineSummary } = await loadService();
    const result = await saveChapterOutlineSummary({
      userId: "user-1",
      novelId: "novel-1",
      chapterNumber: 1,
      outlineSummary: "核心事件: 主角发现失踪信号并决定追查",
    });

    expect(repository.updateChapterOutline).toHaveBeenCalledWith({
      novelId: "novel-1",
      chapterNumber: 1,
      outlineSummary: "核心事件: 主角发现失踪信号并决定追查",
    });
    expect(result).toEqual({ success: true });
  });
});
