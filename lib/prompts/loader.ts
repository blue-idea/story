import fs from "node:fs";
import { PROMPT_PATHS } from "../../config/prompts";
import {
  PromptFileNotFoundError,
  type InstructionId,
  type RenderContext,
  type SystemRole,
  type TemplateId,
} from "./types";

const SYSTEM_ROLES: SystemRole[] = ["editor", "author", "reviewer"];

const INSTRUCTION_IDS: InstructionId[] = [
  "phase1-title",
  "phase2-outline",
  "phase2-characters",
  "phase3-chapter-draft",
  "phase3-chapter-polish",
  "phase3-chapter-rewrite",
  "phase4-suspense-check",
  "wizard-suggest",
  "wizard-extract",
];

const TEMPLATE_IDS: TemplateId[] = [
  "outline",
  "character",
  "chapter",
  "export-novel",
];

function readFileOrThrow(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`ENOENT: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

/** 将 {{key}} 替换为上下文值；缺失变量保留占位符 */
export function interpolate(template: string, ctx: RenderContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = ctx[key];
    if (value === undefined || value === null) {
      return `{{${key}}}`;
    }
    return String(value);
  });
}

/** 加载 System Instruction 角色人设 */
export function getSystem(role: SystemRole): string {
  if (!SYSTEM_ROLES.includes(role)) {
    throw new PromptFileNotFoundError("system", role);
  }
  const filePath = PROMPT_PATHS.system(role);
  try {
    return readFileOrThrow(filePath);
  } catch {
    throw new PromptFileNotFoundError("system", role);
  }
}

/** 渲染分阶段 User Prompt */
export function renderInstruction(
  id: InstructionId,
  ctx: RenderContext = {},
): string {
  if (!INSTRUCTION_IDS.includes(id)) {
    throw new PromptFileNotFoundError("instruction", id);
  }
  const filePath = PROMPT_PATHS.instruction(id);
  let raw: string;
  try {
    raw = readFileOrThrow(filePath);
  } catch {
    throw new PromptFileNotFoundError("instruction", id);
  }
  return interpolate(raw, ctx);
}

/** 加载输出骨架模版（不做变量替换） */
export function loadTemplate(id: TemplateId): string {
  if (!TEMPLATE_IDS.includes(id)) {
    throw new PromptFileNotFoundError("template", id);
  }
  const filePath = PROMPT_PATHS.template(id);
  try {
    return readFileOrThrow(filePath);
  } catch {
    throw new PromptFileNotFoundError("template", id);
  }
}
