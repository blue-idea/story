import type { CoreConfig, CustomConfig } from "../../db/schema";

export type WizardLayer1Step = "q1" | "q2" | "q3" | "summary";
export type WizardLayer2Step =
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "q8"
  | "config-review";
export type WizardLayer3Step = "titles";
export type WizardPhase = "layer1" | "layer2" | "layer3";
export type WizardStep = WizardLayer1Step | WizardLayer2Step | WizardLayer3Step;

export type WizardUiState = {
  phase: WizardPhase;
  step: WizardStep;
  coreConfig: CoreConfig;
  customConfig: Partial<CustomConfig>;
  configConfirmed: boolean;
};

type WizardOption = {
  label: string;
  value: string;
};

type SortedWizardOption = WizardOption & {
  starred: boolean;
};

const LAYER2_SEQUENCE: WizardLayer2Step[] = [
  "q4",
  "q5",
  "q6",
  "q7",
  "q8",
  "config-review",
];

function createEmptyCoreConfig(): CoreConfig {
  return {
    genre: "",
    protagonist: "",
    conflict: "",
  };
}

export function createWizardUiState(): WizardUiState {
  return {
    phase: "layer1",
    step: "q1",
    coreConfig: createEmptyCoreConfig(),
    customConfig: {},
    configConfirmed: false,
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
  questionId: "q1" | "q2" | "q3",
  value: string,
): WizardUiState {
  const normalized = value.trim();
  const nextCoreConfig: CoreConfig = {
    ...state.coreConfig,
  };

  if (questionId === "q1") {
    nextCoreConfig.genre = normalized;
  }
  if (questionId === "q2") {
    nextCoreConfig.protagonist = normalized;
  }
  if (questionId === "q3") {
    nextCoreConfig.conflict = normalized;
  }

  const nextStep: WizardLayer1Step =
    questionId === "q1" ? "q2" : questionId === "q2" ? "q3" : "summary";

  return {
    ...state,
    phase: "layer1",
    step: nextStep,
    coreConfig: nextCoreConfig,
  };
}

export function enterLayer2(state: WizardUiState): WizardUiState {
  if (state.phase !== "layer1" || state.step !== "summary") {
    throw new Error("Layer 2 requires layer1 summary");
  }

  return {
    ...state,
    phase: "layer2",
    step: "q4",
  };
}

function nextLayer2Step(step: WizardLayer2Step): WizardLayer2Step {
  const currentIndex = LAYER2_SEQUENCE.indexOf(step);
  if (currentIndex < 0 || currentIndex === LAYER2_SEQUENCE.length - 1) {
    return "config-review";
  }

  return LAYER2_SEQUENCE[currentIndex + 1] ?? "config-review";
}

export function applyLayer2Answer(
  state: WizardUiState,
  questionId: "q4" | "q5" | "q6" | "q7" | "q8",
  value: string | number,
): WizardUiState {
  if (state.phase !== "layer2") {
    throw new Error("Layer 2 answer requires layer2 phase");
  }

  const nextCustomConfig = {
    ...state.customConfig,
  };

  if (questionId === "q4" && typeof value === "string") {
    nextCustomConfig.worldbuilding = value.trim();
  }
  if (questionId === "q5" && typeof value === "string") {
    nextCustomConfig.perspective = value.trim();
  }
  if (questionId === "q6" && typeof value === "string") {
    nextCustomConfig.theme = value.trim();
  }
  if (questionId === "q7" && typeof value === "string") {
    nextCustomConfig.audience = value.trim();
  }
  if (questionId === "q8" && typeof value === "number" && value > 0) {
    nextCustomConfig.chapterCount = value;
  }

  return {
    ...state,
    customConfig: nextCustomConfig,
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
    step: "q8",
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

export function buildLayer1Summary(coreConfig: CoreConfig): string {
  return `Genre: ${coreConfig.genre}\nProtagonist: ${coreConfig.protagonist}\nConflict: ${coreConfig.conflict}`;
}

export function sortOptionsByPreference(
  options: WizardOption[],
  preferredValues: string[],
): SortedWizardOption[] {
  const preferredSet = new Set(preferredValues.map((value) => value.trim()));

  return [...options]
    .sort((a, b) => {
      const aPreferred = preferredSet.has(a.value);
      const bPreferred = preferredSet.has(b.value);

      if (aPreferred === bPreferred) {
        return 0;
      }

      return aPreferred ? -1 : 1;
    })
    .map((option) => ({
      ...option,
      starred: preferredSet.has(option.value),
    }));
}
