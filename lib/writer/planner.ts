import type {
  CharacterProfile,
  CoreConfig,
  CustomConfig,
} from "../../db/schema";
import { createLLMClient } from "../llm";
import { getSystem, renderInstruction } from "../prompts";
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
  const sectionPattern = /##\s*(主角|反派|配角)\s*\n([\s\S]*?)(?=\n##\s|$)/g;

  let sectionMatch: RegExpExecArray | null;
  while ((sectionMatch = sectionPattern.exec(markdown)) !== null) {
    const roleLabel = sectionMatch[1];
    const body = sectionMatch[2];
    const namePattern = /###\s*(.+?)\s*\n([\s\S]*?)(?=###\s*|\n##\s|$)/g;

    let nameMatch: RegExpExecArray | null;
    while ((nameMatch = namePattern.exec(body)) !== null) {
      profiles.push({
        name: nameMatch[1].trim(),
        role: roleLabel,
        summary: nameMatch[2].trim(),
      });
    }
  }

  return profiles;
}

/** Phase 1 Layer 3：候选标题（phase1-title） */
export async function generateCandidateTitles(
  input: PlannerInput,
): Promise<string[]> {
  const llm = createLLMClient({ provider: "gemini" });
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
  const llm = createLLMClient({ provider: "gemini" });
  const prompt = renderInstruction(
    "phase2-outline",
    buildOutlineContext(input),
  );
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
  const llm = createLLMClient({ provider: "gemini" });
  const prompt = renderInstruction("phase2-characters", {
    outlineSummary: outline,
    genre: input.coreConfig.genre,
    protagonist: input.coreConfig.protagonist,
  });
  const responseText = await llm.generateText({
    prompt,
    systemInstruction: getSystem("editor"),
  });
  return parseCharacterProfilesMarkdown(responseText);
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
