import type { CustomConfig } from "../db/schema";

export const DRAFT_TITLE_PLACEHOLDER = "Untitled Draft";

export const DEFAULT_CUSTOM_CONFIG: CustomConfig = {
  worldbuilding: "现实世界",
  perspective: "第三人称限制",
  tone: "紧张刺激",
  theme: "成长与蜕变",
  audience: "大众读者",
  chapterCount: 20,
};

export const WIZARD_QUESTION_FIELD_MAP = {
  q4: "worldbuilding",
  q5: "perspective",
  q5a: "perspective",
  q5b: "tone",
  q6: "theme",
  q7: "audience",
  q8: "chapterCount",
} as const;

export type WizardQuestionId = keyof typeof WIZARD_QUESTION_FIELD_MAP;
