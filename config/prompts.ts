import path from "node:path";

/** 项目根目录下的 prompts 资源根路径 */
export const PROMPTS_ROOT = path.join(process.cwd(), "prompts");

export const PROMPT_PATHS = {
  system: (role: string) => path.join(PROMPTS_ROOT, "system", `${role}.md`),
  instruction: (id: string) =>
    path.join(PROMPTS_ROOT, "instructions", `${id}.md`),
  template: (name: string) =>
    path.join(PROMPTS_ROOT, "templates", `${name}.md`),
  fragment: (name: string) =>
    path.join(PROMPTS_ROOT, "fragments", `${name}.md`),
} as const;
