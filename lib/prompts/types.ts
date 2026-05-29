/** System 角色人设（对应 prompts/system/*.md） */
export type SystemRole = "editor" | "author" | "reviewer";

/** 分阶段 User Prompt ID（对应 prompts/instructions/*.md） */
export type InstructionId =
  | "phase1-title"
  | "phase2-outline"
  | "phase2-characters"
  | "phase3-chapter-draft"
  | "phase3-chapter-polish"
  | "phase3-chapter-rewrite"
  | "phase4-suspense-check"
  | "wizard-suggest"
  | "wizard-extract";

/** 输出骨架模版 ID（对应 prompts/templates/*.md） */
export type TemplateId = "outline" | "character" | "chapter" | "export-novel";

/** {{变量}} 渲染上下文 */
export type RenderContext = Record<string, string | number | undefined>;

export class PromptFileNotFoundError extends Error {
  constructor(
    public readonly kind: "system" | "instruction" | "template",
    public readonly id: string,
  ) {
    super(`Prompt file not found: ${kind}/${id}`);
    this.name = "PromptFileNotFoundError";
  }
}
