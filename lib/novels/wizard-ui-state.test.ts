import { describe, expect, it } from "vitest";

import {
  applyLayer1Answer,
  applyLayer2Answer,
  buildLayer1Summary,
  createWizardUiState,
  enterLayer2,
  getVisibleLayers,
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

    const q2State = applyLayer1Answer(initial, "q1", "Fantasy");
    expect(q2State.step).toBe("q2");

    const q3State = applyLayer1Answer(q2State, "q2", "Mira");
    expect(q3State.step).toBe("q3");
  });

  it("REQ-002-AC-001b: Q1-Q3 完成后进入 Layer1 摘要，需显式进入 Layer2", () => {
    const summaryState = applyLayer1Answer(
      applyLayer1Answer(
        applyLayer1Answer(createWizardUiState(), "q1", "Fantasy"),
        "q2",
        "Mira",
      ),
      "q3",
      "Escape the collapsing city",
    );

    expect(summaryState.step).toBe("summary");
    expect(buildLayer1Summary(summaryState.coreConfig)).toContain("Genre:");
    expect(getVisibleLayers(summaryState).showLayer2).toBe(false);

    const layer2State = enterLayer2(summaryState);
    expect(layer2State.phase).toBe("layer2");
    expect(layer2State.step).toBe("q4");
  });

  it("REQ-002-AC-002: Layer2 单题支持跳过与直达 Q8", () => {
    const baseState = enterLayer2(
      applyLayer1Answer(
        applyLayer1Answer(
          applyLayer1Answer(createWizardUiState(), "q1", "Sci-Fi"),
          "q2",
          "Kane",
        ),
        "q3",
        "Uncover the hidden signal",
      ),
    );

    const skipped = skipLayer2Question(baseState);
    expect(skipped.step).toBe("q5");

    const jumped = jumpToChapterCount(skipped);
    expect(jumped.step).toBe("q8");
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
                      applyLayer1Answer(createWizardUiState(), "q1", "Mystery"),
                      "q2",
                      "Lynn",
                    ),
                    "q3",
                    "Stop the serial blackout",
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      "q8",
      18,
    );

    expect(q8Done.step).toBe("config-review");
    expect(getVisibleLayers(q8Done).showLayer3).toBe(false);

    const confirmed = markConfigConfirmed(q8Done);
    expect(confirmed.phase).toBe("layer3");
    expect(confirmed.step).toBe("titles");
    expect(getVisibleLayers(confirmed).showLayer3).toBe(true);
  });

  it("REQ-002-AC-004: 偏好项应置顶并标记 starred", () => {
    const sorted = sortOptionsByPreference(
      [
        { label: "Fantasy", value: "Fantasy" },
        { label: "Sci-Fi", value: "Sci-Fi" },
        { label: "Thriller", value: "Thriller" },
      ],
      ["Sci-Fi", "Thriller"],
    );

    expect(sorted.map((item) => item.value)).toEqual([
      "Sci-Fi",
      "Thriller",
      "Fantasy",
    ]);
    expect(sorted[0]?.starred).toBe(true);
    expect(sorted[1]?.starred).toBe(true);
    expect(sorted[2]?.starred).toBe(false);
  });
});
