import type { CoreConfig, CustomConfig } from "../../db/schema";

export type WizardLayer1Step =
  | "q1"
  | "q2-type"
  | "q2-profession"
  | "q2-personality"
  | "q2-supporting"
  | "q3-conflict"
  | "q3-drive"
  | "summary";

export type WizardLayer2Step =
  | "q4-world"
  | "q4-details"
  | "q5-perspective"
  | "q5-tone"
  | "q6-theme"
  | "q7-audience"
  | "q7-style-reference"
  | "q8-chapter-count"
  | "q8-special-requirements"
  | "config-review";

export type WizardLayer3Step = "titles";
export type WizardPhase = "layer1" | "layer2" | "layer3";
export type WizardStep = WizardLayer1Step | WizardLayer2Step | WizardLayer3Step;

export type Layer1Answers = {
  q1Genre: string;
  q1Idea: string;
  q2Type: string;
  q2Profession: string;
  q2Personality: string;
  q2Supporting: string;
  q3Conflict: string;
  q3Drive: string;
};

export type Layer2Answers = {
  q4World: string;
  q4Details: string;
  q5Perspective: string;
  q5Tone: string;
  q6Theme: string;
  q7Audience: string;
  q7StyleReference: string;
  q8ChapterCount: string;
  q8SpecialRequirements: string;
};

export type WizardUiState = {
  phase: WizardPhase;
  step: WizardStep;
  coreConfig: CoreConfig;
  customConfig: Partial<CustomConfig>;
  configConfirmed: boolean;
  layer1Answers: Layer1Answers;
  layer2Answers: Layer2Answers;
  titleRegenerationCount: number;
};

type WizardOption = {
  label: string;
  value: string;
};

type SortedWizardOption = WizardOption & {
  starred: boolean;
};

const LAYER1_SEQUENCE: WizardLayer1Step[] = [
  "q1",
  "q2-type",
  "q2-profession",
  "q2-personality",
  "q2-supporting",
  "q3-conflict",
  "q3-drive",
  "summary",
];

const LAYER2_SEQUENCE: WizardLayer2Step[] = [
  "q4-world",
  "q4-details",
  "q5-perspective",
  "q5-tone",
  "q6-theme",
  "q7-audience",
  "q7-style-reference",
  "q8-chapter-count",
  "q8-special-requirements",
  "config-review",
];

function createEmptyCoreConfig(): CoreConfig {
  return {
    genre: "",
    protagonist: "",
    conflict: "",
  };
}

function createEmptyLayer1Answers(): Layer1Answers {
  return {
    q1Genre: "",
    q1Idea: "",
    q2Type: "",
    q2Profession: "",
    q2Personality: "",
    q2Supporting: "",
    q3Conflict: "",
    q3Drive: "",
  };
}

function createEmptyLayer2Answers(): Layer2Answers {
  return {
    q4World: "",
    q4Details: "",
    q5Perspective: "",
    q5Tone: "",
    q6Theme: "",
    q7Audience: "",
    q7StyleReference: "",
    q8ChapterCount: "",
    q8SpecialRequirements: "",
  };
}

function nextLayer1Step(step: WizardLayer1Step): WizardLayer1Step {
  const currentIndex = LAYER1_SEQUENCE.indexOf(step);
  if (currentIndex < 0 || currentIndex === LAYER1_SEQUENCE.length - 1) {
    return "summary";
  }

  return LAYER1_SEQUENCE[currentIndex + 1] ?? "summary";
}

function nextLayer2Step(step: WizardLayer2Step): WizardLayer2Step {
  const currentIndex = LAYER2_SEQUENCE.indexOf(step);
  if (currentIndex < 0 || currentIndex === LAYER2_SEQUENCE.length - 1) {
    return "config-review";
  }

  return LAYER2_SEQUENCE[currentIndex + 1] ?? "config-review";
}

function joinParts(parts: string[], separator: string) {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(separator);
}

function buildProtagonistSummary(answers: Layer1Answers): string {
  return joinParts(
    [
      answers.q2Type,
      answers.q2Profession,
      answers.q2Personality,
      answers.q2Supporting ? `关键配角：${answers.q2Supporting}` : "",
    ],
    " | ",
  );
}

function buildConflictSummary(answers: Layer1Answers): string {
  return joinParts(
    [answers.q3Conflict, answers.q3Drive ? `驱动力：${answers.q3Drive}` : ""],
    " | ",
  );
}

function parseChapterCount(value: string): number | null {
  const matched = value.match(/\d+/);
  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[0] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function buildCoreConfigFromLayer1Answers(
  answers: Layer1Answers,
): CoreConfig {
  return {
    genre: joinParts(
      [answers.q1Genre, answers.q1Idea ? `创意概要：${answers.q1Idea}` : ""],
      " | ",
    ),
    protagonist: buildProtagonistSummary(answers),
    conflict: buildConflictSummary(answers),
  };
}

export function buildCustomConfigFromLayer2Answers(
  answers: Layer2Answers,
): Partial<CustomConfig> {
  const chapterCount = parseChapterCount(answers.q8ChapterCount);

  return {
    worldbuilding: joinParts(
      [
        answers.q4World,
        answers.q4Details ? `设定要素：${answers.q4Details}` : "",
      ],
      " | ",
    ),
    perspective: answers.q5Perspective.trim(),
    tone: answers.q5Tone.trim(),
    theme: answers.q6Theme.trim(),
    audience: joinParts(
      [
        answers.q7Audience,
        answers.q7StyleReference ? `风格参考：${answers.q7StyleReference}` : "",
      ],
      " | ",
    ),
    chapterCount: chapterCount ?? undefined,
  };
}

export function createWizardUiState(): WizardUiState {
  const layer1Answers = createEmptyLayer1Answers();
  const layer2Answers = createEmptyLayer2Answers();

  return {
    phase: "layer1",
    step: "q1",
    coreConfig: createEmptyCoreConfig(),
    customConfig: {},
    configConfirmed: false,
    layer1Answers,
    layer2Answers,
    titleRegenerationCount: 0,
  };
}

export function getVisibleLayers(state: WizardUiState) {
  return {
    showLayer1: state.phase === "layer1",
    showLayer2: state.phase === "layer2",
    showLayer3: state.phase === "layer3",
  };
}

export function applyLayer1Answer(
  state: WizardUiState,
  questionId:
    | "q1"
    | "q2-type"
    | "q2-profession"
    | "q2-personality"
    | "q2-supporting"
    | "q3-conflict"
    | "q3-drive",
  value: string,
): WizardUiState {
  const normalized = value.trim();
  const nextLayer1Answers: Layer1Answers = {
    ...state.layer1Answers,
  };

  if (questionId === "q1") {
    nextLayer1Answers.q1Genre = normalized;
  }
  if (questionId === "q2-type") {
    nextLayer1Answers.q2Type = normalized;
  }
  if (questionId === "q2-profession") {
    nextLayer1Answers.q2Profession = normalized;
  }
  if (questionId === "q2-personality") {
    nextLayer1Answers.q2Personality = normalized;
  }
  if (questionId === "q2-supporting") {
    nextLayer1Answers.q2Supporting = normalized;
  }
  if (questionId === "q3-conflict") {
    nextLayer1Answers.q3Conflict = normalized;
  }
  if (questionId === "q3-drive") {
    nextLayer1Answers.q3Drive = normalized;
  }

  return {
    ...state,
    phase: "layer1",
    step: nextLayer1Step(questionId),
    layer1Answers: nextLayer1Answers,
    coreConfig: buildCoreConfigFromLayer1Answers(nextLayer1Answers),
  };
}

export function enterLayer2(state: WizardUiState): WizardUiState {
  if (state.phase !== "layer1" || state.step !== "summary") {
    throw new Error("Layer 2 requires layer1 summary");
  }

  return {
    ...state,
    phase: "layer2",
    step: "q4-world",
  };
}

export function applyLayer2Answer(
  state: WizardUiState,
  questionId:
    | "q4-world"
    | "q4-details"
    | "q5-perspective"
    | "q5-tone"
    | "q6-theme"
    | "q7-audience"
    | "q7-style-reference"
    | "q8-chapter-count"
    | "q8-special-requirements",
  value: string,
): WizardUiState {
  if (state.phase !== "layer2") {
    throw new Error("Layer 2 answer requires layer2 phase");
  }

  const normalized = value.trim();
  const nextLayer2Answers: Layer2Answers = {
    ...state.layer2Answers,
  };

  if (questionId === "q4-world") {
    nextLayer2Answers.q4World = normalized;
  }
  if (questionId === "q4-details") {
    nextLayer2Answers.q4Details = normalized;
  }
  if (questionId === "q5-perspective") {
    nextLayer2Answers.q5Perspective = normalized;
  }
  if (questionId === "q5-tone") {
    nextLayer2Answers.q5Tone = normalized;
  }
  if (questionId === "q6-theme") {
    nextLayer2Answers.q6Theme = normalized;
  }
  if (questionId === "q7-audience") {
    nextLayer2Answers.q7Audience = normalized;
  }
  if (questionId === "q7-style-reference") {
    nextLayer2Answers.q7StyleReference = normalized;
  }
  if (questionId === "q8-chapter-count") {
    nextLayer2Answers.q8ChapterCount = normalized;
  }
  if (questionId === "q8-special-requirements") {
    nextLayer2Answers.q8SpecialRequirements = normalized;
  }

  return {
    ...state,
    layer2Answers: nextLayer2Answers,
    customConfig: buildCustomConfigFromLayer2Answers(nextLayer2Answers),
    step: nextLayer2Step(questionId),
  };
}

export function skipLayer2Question(state: WizardUiState): WizardUiState {
  if (state.phase !== "layer2") {
    throw new Error("Skip requires layer2 phase");
  }

  const currentStep = state.step as WizardLayer2Step;
  if (currentStep === "config-review") {
    return state;
  }

  return {
    ...state,
    step: nextLayer2Step(currentStep),
  };
}

export function jumpToChapterCount(state: WizardUiState): WizardUiState {
  if (state.phase !== "layer2") {
    throw new Error("Jump requires layer2 phase");
  }

  return {
    ...state,
    step: "q8-chapter-count",
  };
}

export function markConfigConfirmed(state: WizardUiState): WizardUiState {
  if (state.phase !== "layer2" || state.step !== "config-review") {
    throw new Error("Config confirm requires config-review step");
  }

  return {
    ...state,
    phase: "layer3",
    step: "titles",
    configConfirmed: true,
  };
}

function summarize(value: string, fallback = "未填写") {
  return value.trim() || fallback;
}

export function buildLayer1Summary(answers: Layer1Answers): string {
  return [
    "## 已收集信息",
    "",
    `题材：${summarize(answers.q1Genre)}${answers.q1Idea ? ` — ${answers.q1Idea}` : ""}`,
    `主角：${summarize(buildProtagonistSummary(answers))}`,
    `冲突：${summarize(answers.q3Conflict)}${answers.q3Drive ? ` | 驱动力：${answers.q3Drive}` : ""}`,
  ].join("\n");
}

export function buildReviewSummary(
  layer1Answers: Layer1Answers,
  layer2Answers: Layer2Answers,
): string {
  const chapterCount = summarize(
    layer2Answers.q8ChapterCount,
    "20章（中篇，约6-10万字）⭐",
  );

  return [
    "## 创作配置确认",
    "",
    `题材：${summarize(layer1Answers.q1Genre)}${layer1Answers.q1Idea ? ` — ${layer1Answers.q1Idea}` : ""}`,
    `主角：${summarize(buildProtagonistSummary(layer1Answers))}`,
    `冲突：${summarize(layer1Answers.q3Conflict)}${layer1Answers.q3Drive ? ` | 驱动力：${layer1Answers.q3Drive}` : ""}`,
    `世界观：${summarize(layer2Answers.q4World)}${layer2Answers.q4Details ? ` | ${layer2Answers.q4Details}` : ""}`,
    `视角：${summarize(layer2Answers.q5Perspective)}`,
    `基调：${summarize(layer2Answers.q5Tone)}`,
    `主题：${summarize(layer2Answers.q6Theme)}`,
    `读者：${summarize(layer2Answers.q7Audience)}${layer2Answers.q7StyleReference ? ` | 风格参考：${layer2Answers.q7StyleReference}` : ""}`,
    `规模：${chapterCount}${layer2Answers.q8SpecialRequirements ? ` | 特殊要求：${layer2Answers.q8SpecialRequirements}` : ""}`,
  ].join("\n");
}

function normalizePreferenceText(value: string) {
  return value.replace(/[⭐🎲（）()\/\-\s]/g, "").toLowerCase();
}

function isPreferredOption(option: WizardOption, preferredValues: string[]) {
  const optionTexts = [option.value, option.label].map(normalizePreferenceText);

  return preferredValues.some((preferredValue) => {
    const normalizedPreferred = normalizePreferenceText(preferredValue.trim());
    if (!normalizedPreferred) {
      return false;
    }

    return optionTexts.some(
      (optionText) =>
        optionText.includes(normalizedPreferred) ||
        normalizedPreferred.includes(optionText),
    );
  });
}

export function sortOptionsByPreference(
  options: WizardOption[],
  preferredValues: string[],
): SortedWizardOption[] {
  return [...options]
    .sort((a, b) => {
      const aPreferred = isPreferredOption(a, preferredValues);
      const bPreferred = isPreferredOption(b, preferredValues);

      if (aPreferred === bPreferred) {
        return 0;
      }

      return aPreferred ? -1 : 1;
    })
    .map((option) => ({
      ...option,
      starred: isPreferredOption(option, preferredValues),
    }));
}
