import {
  DEFAULT_CUSTOM_CONFIG,
  DRAFT_TITLE_PLACEHOLDER,
  WIZARD_QUESTION_FIELD_MAP,
  type WizardQuestionId,
} from "../../config/novel";
import type {
  CoreConfig,
  CustomConfig,
  UserPreferencesPayload,
} from "../../db/schema";
import { createLLMClient } from "../llm";
import { getSystem, renderInstruction } from "../prompts";
import { generateCandidateTitles, runPhase2Planning } from "../writer/planner";
import {
  createNovelDraft,
  findOwnedNovel,
  getNovelPlan,
  getUserPreferences,
  saveNovelPlan,
  updateChapterOutline,
  updateNovelCustomConfig,
  updateNovelTitleAndStatus,
} from "./repository";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeChapterCount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function ensureCoreConfig(input: unknown): CoreConfig {
  const genre = normalizeText((input as Partial<CoreConfig>)?.genre);
  const protagonist = normalizeText(
    (input as Partial<CoreConfig>)?.protagonist,
  );
  const conflict = normalizeText((input as Partial<CoreConfig>)?.conflict);

  if (!genre || !protagonist || !conflict) {
    throw new ValidationError("Invalid coreConfig");
  }

  return {
    genre,
    protagonist,
    conflict,
  };
}

function ensureCustomConfigPartial(input: unknown): Partial<CustomConfig> {
  const partialInput = (input ?? {}) as Partial<CustomConfig>;
  const partial: Partial<CustomConfig> = {};

  const worldbuilding = normalizeText(partialInput.worldbuilding);
  if (worldbuilding) {
    partial.worldbuilding = worldbuilding;
  }

  const perspective = normalizeText(partialInput.perspective);
  if (perspective) {
    partial.perspective = perspective;
  }

  const tone = normalizeText(partialInput.tone);
  if (tone) {
    partial.tone = tone;
  }

  const theme = normalizeText(partialInput.theme);
  if (theme) {
    partial.theme = theme;
  }

  const audience = normalizeText(partialInput.audience);
  if (audience) {
    partial.audience = audience;
  }

  const chapterCount = normalizeChapterCount(partialInput.chapterCount);
  if (chapterCount) {
    partial.chapterCount = chapterCount;
  }

  if (Object.keys(partial).length === 0) {
    throw new ValidationError("Invalid customConfigPartial");
  }

  return partial;
}

function buildDefaultCustomConfig(
  preferences: UserPreferencesPayload | null,
): CustomConfig {
  return {
    worldbuilding: DEFAULT_CUSTOM_CONFIG.worldbuilding,
    perspective: DEFAULT_CUSTOM_CONFIG.perspective,
    tone: normalizeText(preferences?.defaultTone) || DEFAULT_CUSTOM_CONFIG.tone,
    theme: DEFAULT_CUSTOM_CONFIG.theme,
    audience: DEFAULT_CUSTOM_CONFIG.audience,
    chapterCount:
      preferences?.defaultChapterCount && preferences.defaultChapterCount > 0
        ? preferences.defaultChapterCount
        : DEFAULT_CUSTOM_CONFIG.chapterCount,
  };
}

function mergeCustomConfig(
  current: CustomConfig,
  partial: Partial<CustomConfig>,
): CustomConfig {
  return {
    ...current,
    ...partial,
  };
}

function fillCustomConfigDefaults(
  current: CustomConfig,
  defaults: CustomConfig,
): CustomConfig {
  return {
    worldbuilding:
      normalizeText(current.worldbuilding) || defaults.worldbuilding,
    perspective: normalizeText(current.perspective) || defaults.perspective,
    tone: normalizeText(current.tone) || defaults.tone,
    theme: normalizeText(current.theme) || defaults.theme,
    audience: normalizeText(current.audience) || defaults.audience,
    chapterCount:
      current.chapterCount > 0 ? current.chapterCount : defaults.chapterCount,
  };
}

async function requireOwnedNovel(userId: string, novelId: string) {
  const novel = await findOwnedNovel(userId, novelId);

  if (!novel) {
    throw new NotFoundError("Novel not found");
  }

  return novel;
}

function ensureDraftStatus(status: string) {
  if (status !== "draft") {
    throw new ValidationError("Novel is not in draft status");
  }
}

function buildAnsweredContext(input: {
  coreConfig: CoreConfig;
  customConfig: CustomConfig;
}): string {
  return [
    `genre: ${input.coreConfig.genre}`,
    `protagonist: ${input.coreConfig.protagonist}`,
    `conflict: ${input.coreConfig.conflict}`,
    `worldbuilding: ${input.customConfig.worldbuilding}`,
    `perspective: ${input.customConfig.perspective}`,
    `tone: ${input.customConfig.tone}`,
    `theme: ${input.customConfig.theme}`,
    `audience: ${input.customConfig.audience}`,
    `chapterCount: ${input.customConfig.chapterCount}`,
  ].join("\n");
}

function resolveSuggestionField(questionId: string) {
  const field = WIZARD_QUESTION_FIELD_MAP[questionId as WizardQuestionId];

  if (!field) {
    throw new ValidationError("Unsupported questionId");
  }

  return field;
}

export async function createWizardDraft(input: {
  userId: string;
  coreConfig: unknown;
}) {
  const preferences = await getUserPreferences(input.userId);
  const coreConfig = ensureCoreConfig(input.coreConfig);
  const customConfig = buildDefaultCustomConfig(preferences);
  const novel = await createNovelDraft({
    userId: input.userId,
    title: DRAFT_TITLE_PLACEHOLDER,
    coreConfig,
    customConfig,
  });

  return {
    novelId: novel.id,
    status: novel.status,
  };
}

export async function updateWizardDraft(input: {
  userId: string;
  novelId: string;
  customConfigPartial: unknown;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);
  ensureDraftStatus(novel.status);

  const partial = ensureCustomConfigPartial(input.customConfigPartial);
  const updated = await updateNovelCustomConfig(
    input.novelId,
    mergeCustomConfig(novel.customConfig, partial),
  );

  return {
    novelId: updated.id,
    status: updated.status,
    customConfig: updated.customConfig,
  };
}

export async function generateWizardSuggestion(input: {
  userId: string;
  novelId: string;
  questionId: string;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);
  ensureDraftStatus(novel.status);

  const field = resolveSuggestionField(input.questionId);
  const prompt = renderInstruction("wizard-suggest", {
    questionId: input.questionId,
    answeredContext: buildAnsweredContext({
      coreConfig: novel.coreConfig,
      customConfig: novel.customConfig,
    }),
  });
  const llm = createLLMClient({ provider: "gemini" });
  const suggestion = normalizeText(
    await llm.generateText({
      prompt,
      systemInstruction: getSystem("editor"),
    }),
  );

  return {
    field,
    suggestion,
  };
}

export async function confirmWizardConfig(input: {
  userId: string;
  novelId: string;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);
  ensureDraftStatus(novel.status);

  const defaults = buildDefaultCustomConfig(
    await getUserPreferences(input.userId),
  );
  const customConfig = fillCustomConfigDefaults(novel.customConfig, defaults);
  const updated = await updateNovelCustomConfig(input.novelId, customConfig);

  return {
    novelId: updated.id,
    status: updated.status,
    customConfig: updated.customConfig,
  };
}

export async function generateWizardTitles(input: {
  userId: string;
  novelId: string;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);
  ensureDraftStatus(novel.status);

  const candidateTitles = await generateCandidateTitles({
    coreConfig: novel.coreConfig,
    customConfig: novel.customConfig,
  });

  return {
    candidateTitles,
  };
}

export async function confirmWizardTitle(input: {
  userId: string;
  novelId: string;
  title: string;
}) {
  const title = normalizeText(input.title);
  if (!title) {
    throw new ValidationError("Invalid title");
  }

  const novel = await requireOwnedNovel(input.userId, input.novelId);
  ensureDraftStatus(novel.status);

  const updated = await updateNovelTitleAndStatus(
    input.novelId,
    title,
    "planning",
  );
  const plan = await runPhase2Planning({
    coreConfig: novel.coreConfig,
    customConfig: novel.customConfig,
    title,
  });

  await saveNovelPlan(input.novelId, plan);

  return {
    novelId: updated.id,
    status: updated.status,
  };
}

export async function loadNovelPlan(input: {
  userId: string;
  novelId: string;
}) {
  await requireOwnedNovel(input.userId, input.novelId);
  const plan = await getNovelPlan(input.novelId);

  if (!plan) {
    throw new NotFoundError("Novel plan not found");
  }

  return plan;
}

export async function saveChapterOutlineSummary(input: {
  userId: string;
  novelId: string;
  chapterNumber: number;
  outlineSummary: string;
}) {
  await requireOwnedNovel(input.userId, input.novelId);

  if (!Number.isInteger(input.chapterNumber) || input.chapterNumber <= 0) {
    throw new ValidationError("Invalid chapterNumber");
  }

  const outlineSummary = normalizeText(input.outlineSummary);
  if (!outlineSummary) {
    throw new ValidationError("Invalid outlineSummary");
  }

  const updated = await updateChapterOutline({
    novelId: input.novelId,
    chapterNumber: input.chapterNumber,
    outlineSummary,
  });

  if (!updated) {
    throw new NotFoundError("Chapter not found");
  }

  return {
    success: true,
  };
}
