import type {
  CharacterProfile,
  CoreConfig,
  CustomConfig,
} from "../../db/schema";
import { createDefaultLLMClient } from "../llm";
import { getSystem, loadTemplate, renderInstruction } from "../prompts";
import { parseChaptersFromOutline, type ParsedChapter } from "./parse-outline";

/** Q1-Q8 配置（对齐 novels.core_config / custom_config） */
export type PlannerInput = {
  coreConfig: CoreConfig;
  customConfig: CustomConfig;
};

export type PlannerInputWithTitle = PlannerInput & {
  title: string;
};

export type Phase2PlanResult = {
  outline: string;
  characterProfiles: CharacterProfile[];
  chapters: ParsedChapter[];
};

export type { ParsedChapter };

function buildTitleContext(input: PlannerInput) {
  return {
    genre: input.coreConfig.genre,
    protagonist: input.coreConfig.protagonist,
    conflict: input.coreConfig.conflict,
    theme: input.customConfig.theme,
    tone: input.customConfig.tone,
  };
}

function buildOutlineContext(input: PlannerInputWithTitle) {
  return {
    ...buildTitleContext(input),
    title: input.title,
    chapterCount: String(input.customConfig.chapterCount),
  };
}

/** 解析 phase1-title 编号列表输出 */
export function parseCandidateTitles(responseText: string): string[] {
  const titles: string[] = [];
  for (const line of responseText.split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(/^\d+\.\s*(.+?)(?:\s*[—\-–]\s*|$)/);
    if (match?.[1]) {
      titles.push(match[1].trim());
    }
  }
  return titles;
}

/** 从人物档案 Markdown 解析为 CharacterProfile[] */
export function parseCharacterProfilesMarkdown(
  markdown: string,
): CharacterProfile[] {
  const profiles: CharacterProfile[] = [];
  const lines = markdown.split(/\r?\n/);
  let currentRole: CharacterProfile["role"] | null = null;
  let currentName: string | null = null;
  let currentSummary: string[] = [];

  const pushCurrentProfile = () => {
    if (!currentRole || !currentName) {
      currentSummary = [];
      return;
    }

    profiles.push({
      name: currentName,
      role: currentRole,
      summary: currentSummary.join("\n").trim(),
    });
    currentSummary = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{2,4})\s*(.+?)\s*$/);
    if (!headingMatch) {
      if (currentName) {
        currentSummary.push(line);
      }
      continue;
    }

    const level = headingMatch[1].length;
    const headingText = normalizeHeadingText(headingMatch[2]);

    if (level === 2) {
      pushCurrentProfile();
      currentName = null;
      currentRole = resolveRoleLabel(headingText);
      continue;
    }

    const inlineRoleHeading = parseInlineRoleHeading(headingText);
    const nextRole = inlineRoleHeading?.role ?? currentRole;
    const nextName =
      inlineRoleHeading?.name ?? sanitizeProfileName(headingText);

    if (!nextRole || !nextName) {
      continue;
    }

    pushCurrentProfile();
    currentRole = nextRole;
    currentName = nextName;
  }

  pushCurrentProfile();
  return profiles;
}

function normalizeHeadingText(value: string): string {
  return value.replace(/[*_`]/g, "").trim();
}

function resolveRoleLabel(value: string): CharacterProfile["role"] | null {
  if (value.includes("主角")) {
    return "主角";
  }
  if (value.includes("反派")) {
    return "反派";
  }
  if (value.includes("配角")) {
    return "配角";
  }
  return null;
}

function sanitizeProfileName(value: string): string {
  return value
    .replace(/^角色\s*/u, "")
    .replace(/^\[([^\]]+)\]$/u, "$1")
    .replace(/^\s*[【(（]\s*/u, "")
    .replace(/\s*[】)）]\s*$/u, "")
    .replace(/\s*[（(](主角|反派|配角)[)）]\s*$/u, "")
    .replace(/\s*[/|｜·-]\s*(主角|反派|配角)\s*$/u, "")
    .trim();
}

function parseInlineRoleHeading(
  value: string,
): { role: CharacterProfile["role"]; name: string } | null {
  const match = value.match(/^(主角|反派|配角)\s*[:：-]\s*(.+)$/u);
  if (!match?.[1] || !match[2]) {
    return null;
  }

  const role = resolveRoleLabel(match[1]);
  const name = sanitizeProfileName(match[2]);
  if (!role || !name) {
    return null;
  }

  return { role, name };
}

/** Phase 1 Layer 3：候选标题（phase1-title） */
export async function generateCandidateTitles(
  input: PlannerInput,
): Promise<string[]> {
  const llm = createDefaultLLMClient();
  const prompt = renderInstruction("phase1-title", buildTitleContext(input));
  const responseText = await llm.generateText({
    prompt,
    systemInstruction: getSystem("editor"),
  });
  return parseCandidateTitles(responseText);
}

/** Phase 2 第 1 次 LLM：完整 7 列大纲 */
export async function generateOutline(
  input: PlannerInputWithTitle,
): Promise<string> {
  const llm = createDefaultLLMClient();
  const prompt = renderInstruction("phase2-outline", {
    ...buildOutlineContext(input),
    outlineTemplate: loadTemplate("outline"),
  });
  return llm.generateText({
    prompt,
    systemInstruction: getSystem("editor"),
  });
}

/** Phase 2 第 2 次 LLM：人物档案（依赖 outline） */
export async function generateCharacterProfiles(
  input: PlannerInputWithTitle,
  outline: string,
): Promise<CharacterProfile[]> {
  const llm = createDefaultLLMClient();
  const prompt = renderInstruction("phase2-characters", {
    outlineSummary: outline,
    genre: input.coreConfig.genre,
    protagonist: input.coreConfig.protagonist,
    characterTemplate: loadTemplate("character"),
  });
  const responseText = await llm.generateText({
    prompt,
    systemInstruction: getSystem("editor"),
  });
  return parseCharacterProfilesMarkdown(responseText);
}

/** Phase 2 第 1 次 LLM：完整 7 列大纲的流式生成 */
export async function* generateOutlineStream(
  input: PlannerInputWithTitle,
): AsyncGenerator<
  { type: "chunk"; content: string } | { type: "done"; content: string },
  void,
  unknown
> {
  const llm = createDefaultLLMClient();
  const prompt = renderInstruction("phase2-outline", {
    ...buildOutlineContext(input),
    outlineTemplate: loadTemplate("outline"),
  });
  let fullText = "";
  for await (const chunk of llm.generateStream({
    prompt,
    systemInstruction: getSystem("editor"),
  })) {
    fullText += chunk;
    yield { type: "chunk", content: chunk };
  }
  yield { type: "done", content: fullText };
}

/** Phase 2 第 2 次 LLM：人物档案的流式生成（依赖 outline） */
export async function* generateCharacterProfilesStream(
  input: PlannerInputWithTitle,
  outline: string,
): AsyncGenerator<
  | { type: "chunk"; content: string }
  | { type: "done"; content: CharacterProfile[] },
  void,
  unknown
> {
  const llm = createDefaultLLMClient();
  const prompt = renderInstruction("phase2-characters", {
    outlineSummary: outline,
    genre: input.coreConfig.genre,
    protagonist: input.coreConfig.protagonist,
    characterTemplate: loadTemplate("character"),
  });
  let fullText = "";
  for await (const chunk of llm.generateStream({
    prompt,
    systemInstruction: getSystem("editor"),
  })) {
    fullText += chunk;
    yield { type: "chunk", content: chunk };
  }
  const profiles = parseCharacterProfilesMarkdown(fullText);
  yield { type: "done", content: profiles };
}

/**
 * Phase 2 完整规划：先 outline → 再 characters → 解析 chapters
 */
export async function runPhase2Planning(
  input: PlannerInputWithTitle,
): Promise<Phase2PlanResult> {
  const outline = await generateOutline(input);
  const characterProfiles = await generateCharacterProfiles(input, outline);
  const chapters = parseChaptersFromOutline(outline);

  return {
    outline,
    characterProfiles,
    chapters,
  };
}

export { parseChaptersFromOutline };
