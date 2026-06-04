import { describe, expect, it } from "vitest";

import {
  applyLayer1Answer,
  applyLayer2Answer,
  buildLayer1Summary,
  buildReviewSummary,
  createWizardUiState,
  enterLayer2,
  getVisibleLayers,
  goBackWizardStep,
  jumpToChapterCount,
  markConfigConfirmed,
  skipLayer2Question,
  sortOptionsByPreference,
} from "./wizard-ui-state";

describe("向导状态机", () => {
  it("REQ-002-AC-001: Layer1 仅显示当前问题，未完成前不显示 Layer2/Layer3", () => {
    const initial = createWizardUiState();
    expect(initial.phase).toBe("layer1");
    expect(initial.step).toBe("q1");
    expect(getVisibleLayers(initial)).toEqual({
      showLayer1: true,
      showLayer2: false,
      showLayer3: false,
    });

    const q2TypeState = applyLayer1Answer(initial, "q1", "悬疑推理");
    expect(q2TypeState.step).toBe("q2-type");

    const q2ProfessionState = applyLayer1Answer(
      q2TypeState,
      "q2-type",
      "女性主角（独角戏）",
    );
    expect(q2ProfessionState.step).toBe("q2-profession");
  });

  it("REQ-002-AC-001b: Q1-Q3 完成后进入 Layer1 摘要，需显式进入 Layer2", () => {
    const summaryState = applyLayer1Answer(
      applyLayer1Answer(
        applyLayer1Answer(
          applyLayer1Answer(
            applyLayer1Answer(
              applyLayer1Answer(
                applyLayer1Answer(createWizardUiState(), "q1", "科幻未来"),
                "q2-type",
                "女性主角（独角戏）",
              ),
              "q2-profession",
              "调查员",
            ),
            "q2-personality",
            "冷静智慧（理性、谋略、高智商）",
          ),
          "q2-supporting",
          "亦敌亦友的前搭档",
        ),
        "q3-conflict",
        "查明真相（寻找答案、揭露秘密）",
      ),
      "q3-drive",
      "好奇心/求知欲（想知道真相）",
    );

    expect(summaryState.step).toBe("summary");
    expect(buildLayer1Summary(summaryState.layer1Answers)).toContain(
      "题材：科幻未来",
    );
    expect(buildLayer1Summary(summaryState.layer1Answers)).toContain("主角：");
    expect(getVisibleLayers(summaryState).showLayer2).toBe(false);

    const layer2State = enterLayer2(summaryState);
    expect(layer2State.phase).toBe("layer2");
    expect(layer2State.step).toBe("q4-world");
  });

  it("REQ-002-AC-002: Layer2 单题支持跳过与直达 Q8", () => {
    const baseState = enterLayer2(
      applyLayer1Answer(
        applyLayer1Answer(
          applyLayer1Answer(
            applyLayer1Answer(
              applyLayer1Answer(
                applyLayer1Answer(
                  applyLayer1Answer(createWizardUiState(), "q1", "科幻未来"),
                  "q2-type",
                  "男性主角（独角戏）",
                ),
                "q2-profession",
                "工程师",
              ),
              "q2-personality",
              "成长逆袭（从弱到强、打脸升级）",
            ),
            "q2-supporting",
            "神秘盟友",
          ),
          "q3-conflict",
          "查明真相（寻找答案、揭露秘密）",
        ),
        "q3-drive",
        "责任/使命（不得不做）",
      ),
    );

    const skipped = skipLayer2Question(baseState);
    expect(skipped.step).toBe("q4-details");

    const jumped = jumpToChapterCount(skipped);
    expect(jumped.step).toBe("q8-chapter-count");
  });

  it("REQ-002-AC-002b: 进入配置确认前不显示 Layer3；确认后才进入标题层", () => {
    const q8Done = applyLayer2Answer(
      jumpToChapterCount(
        skipLayer2Question(
          skipLayer2Question(
            skipLayer2Question(
              skipLayer2Question(
                enterLayer2(
                  applyLayer1Answer(
                    applyLayer1Answer(
                      applyLayer1Answer(
                        applyLayer1Answer(
                          applyLayer1Answer(
                            applyLayer1Answer(
                              applyLayer1Answer(
                                createWizardUiState(),
                                "q1",
                                "悬疑推理",
                              ),
                              "q2-type",
                              "女性主角（独角戏）",
                            ),
                            "q2-profession",
                            "侦探",
                          ),
                          "q2-personality",
                          "冷静智慧（理性、谋略、高智商）",
                        ),
                        "q2-supporting",
                        "老搭档",
                      ),
                      "q3-conflict",
                      "查明真相（寻找答案、揭露秘密）",
                    ),
                    "q3-drive",
                    "好奇心/求知欲（想知道真相）",
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      "q8-chapter-count",
      "15章（中短篇，约4.5-7.5万字）",
    );

    expect(q8Done.step).toBe("q8-special-requirements");

    const reviewState = applyLayer2Answer(
      q8Done,
      "q8-special-requirements",
      "没有特殊要求，按标准来",
    );

    expect(reviewState.step).toBe("config-review");
    expect(getVisibleLayers(reviewState).showLayer3).toBe(false);

    const confirmed = markConfigConfirmed(reviewState);
    expect(confirmed.phase).toBe("layer3");
    expect(confirmed.step).toBe("titles");
    expect(getVisibleLayers(confirmed).showLayer3).toBe(true);
  });

  it("REQ-002-AC-002d: 后退应按真实访问历史返回上一题，而不是固定题序", () => {
    const baseState = enterLayer2(
      applyLayer1Answer(
        applyLayer1Answer(
          applyLayer1Answer(
            applyLayer1Answer(
              applyLayer1Answer(
                applyLayer1Answer(
                  applyLayer1Answer(createWizardUiState(), "q1", "科幻未来"),
                  "q2-type",
                  "男性主角（独角戏）",
                ),
                "q2-profession",
                "工程师",
              ),
              "q2-personality",
              "成长逆袭（从弱到强、打脸升级）",
            ),
            "q2-supporting",
            "神秘盟友",
          ),
          "q3-conflict",
          "查明真相（寻找答案、揭露秘密）",
        ),
        "q3-drive",
        "责任/使命（不得不做）",
      ),
    );

    const skipped = skipLayer2Question(baseState);
    const jumped = jumpToChapterCount(skipped);

    expect(jumped.step).toBe("q8-chapter-count");

    const backToVisitedStep = goBackWizardStep(jumped);
    expect(backToVisitedStep.phase).toBe("layer2");
    expect(backToVisitedStep.step).toBe("q4-details");

    const backAgain = goBackWizardStep(backToVisitedStep);
    expect(backAgain.phase).toBe("layer2");
    expect(backAgain.step).toBe("q4-world");
  });

  it("REQ-002-AC-002d: 标题层与摘要层都应支持后退重新选择", () => {
    const summaryState = applyLayer1Answer(
      applyLayer1Answer(
        applyLayer1Answer(
          applyLayer1Answer(
            applyLayer1Answer(
              applyLayer1Answer(
                applyLayer1Answer(createWizardUiState(), "q1", "悬疑推理"),
                "q2-type",
                "女性主角（独角戏）",
              ),
              "q2-profession",
              "侦探",
            ),
            "q2-personality",
            "冷静智慧（理性、谋略、高智商）",
          ),
          "q2-supporting",
          "老搭档",
        ),
        "q3-conflict",
        "查明真相（寻找答案、揭露秘密）",
      ),
      "q3-drive",
      "好奇心/求知欲（想知道真相）",
    );

    const backFromSummary = goBackWizardStep(summaryState);
    expect(backFromSummary.phase).toBe("layer1");
    expect(backFromSummary.step).toBe("q3-drive");

    const confirmed = markConfigConfirmed(
      applyLayer2Answer(
        applyLayer2Answer(
          jumpToChapterCount(enterLayer2(summaryState)),
          "q8-chapter-count",
          "15章（中短篇，约4.5-7.5万字）",
        ),
        "q8-special-requirements",
        "没有特殊要求，按标准来",
      ),
    );

    expect(confirmed.phase).toBe("layer3");
    expect(confirmed.step).toBe("titles");

    const backFromTitles = goBackWizardStep(confirmed);
    expect(backFromTitles.phase).toBe("layer2");
    expect(backFromTitles.step).toBe("config-review");
  });

  it("REQ-002-AC-004: 偏好项应置顶并标记 starred", () => {
    const sorted = sortOptionsByPreference(
      [
        { label: "奇幻玄幻", value: "奇幻玄幻" },
        { label: "科幻未来", value: "科幻未来" },
        { label: "悬疑推理", value: "悬疑推理" },
      ],
      ["科幻未来", "悬疑推理"],
    );

    expect(sorted.map((item) => item.value)).toEqual([
      "科幻未来",
      "悬疑推理",
      "奇幻玄幻",
    ]);
    expect(sorted[0]?.starred).toBe(true);
    expect(sorted[1]?.starred).toBe(true);
    expect(sorted[2]?.starred).toBe(false);
  });

  it("应输出与文档一致的第二层配置摘要", () => {
    const state = createWizardUiState();
    state.layer1Answers.q1Genre = "悬疑推理";
    state.layer1Answers.q2Type = "女性主角（独角戏）";
    state.layer1Answers.q2Profession = "侦探";
    state.layer1Answers.q2Personality = "冷静智慧（理性、谋略、高智商）";
    state.layer1Answers.q3Conflict = "查明真相（寻找答案、揭露秘密）";
    state.layer1Answers.q3Drive = "好奇心/求知欲（想知道真相）";
    state.layer2Answers.q4World = "现实世界（当代中国或其他现实背景）";
    state.layer2Answers.q5Perspective =
      "第三人称限制视角（跟随主角的所见所感）";
    state.layer2Answers.q5Tone = "紧张刺激（快节奏、高冲突、悬念驱动）";
    state.layer2Answers.q6Theme = "正义与复仇（善恶对决、伸张正义）";
    state.layer2Answers.q7Audience =
      "大众读者（番茄小说/网络文学受众，追求爽感和代入感）";
    state.layer2Answers.q8ChapterCount = "20章（中篇，约6-10万字）⭐";

    const summary = buildReviewSummary(
      state.layer1Answers,
      state.layer2Answers,
    );
    expect(summary).toContain("题材");
    expect(summary).toContain("世界观");
    expect(summary).toContain("规模");
  });
});
