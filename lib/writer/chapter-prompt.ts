import type { CharacterProfile } from "../../db/schema";
import { getSystem, renderInstruction } from "../prompts";

export type ChapterPromptContext = {
  chapterNumber: number;
  chapterTitle: string;
  /** 本章 7 列规划行（来自 chapters.outline_summary） */
  outlineRow: string;
  selectedProfiles: CharacterProfile[];
  summaryTimeline: string;
  previousExcerpt: string;
  perspectiveBoundary: string;
  diagnosticLog?: string;
};

function formatCharacterProfiles(profiles: CharacterProfile[]): string {
  if (profiles.length === 0) {
    return "（暂无人物档案）";
  }
  return profiles
    .map(
      (profile) => `### ${profile.name}（${profile.role}）\n${profile.summary}`,
    )
    .join("\n\n");
}

/** Phase 3 初稿：phase3-chapter-draft */
export function buildChapterDraftPrompt(ctx: ChapterPromptContext): {
  prompt: string;
  systemInstruction: string;
} {
  const prompt = renderInstruction("phase3-chapter-draft", {
    chapterNumber: String(ctx.chapterNumber),
    chapterTitle: ctx.chapterTitle,
    outlineRow: ctx.outlineRow,
    characterProfiles: formatCharacterProfiles(ctx.selectedProfiles),
    summaryTimeline: ctx.summaryTimeline,
    previousExcerpt: ctx.previousExcerpt,
    perspectiveBoundary: ctx.perspectiveBoundary,
  });
  return { prompt, systemInstruction: getSystem("author") };
}

/** Phase 3 校验失败重写：phase3-chapter-rewrite */
export function buildChapterRewritePrompt(ctx: ChapterPromptContext): {
  prompt: string;
  systemInstruction: string;
} {
  const prompt = renderInstruction("phase3-chapter-rewrite", {
    chapterNumber: String(ctx.chapterNumber),
    chapterTitle: ctx.chapterTitle,
    outlineRow: ctx.outlineRow,
    characterProfiles: formatCharacterProfiles(ctx.selectedProfiles),
    summaryTimeline: ctx.summaryTimeline,
    previousExcerpt: ctx.previousExcerpt,
    perspectiveBoundary: ctx.perspectiveBoundary,
    diagnosticLog: ctx.diagnosticLog ?? "",
  });
  return { prompt, systemInstruction: getSystem("author") };
}

export function buildChapterSummaryPrompt(input: {
  chapterNumber: number;
  chapterTitle: string;
  outlineRow: string;
  content: string;
}): {
  prompt: string;
  systemInstruction: string;
} {
  const prompt = renderInstruction("phase3-chapter-summary", {
    chapterNumber: String(input.chapterNumber),
    chapterTitle: input.chapterTitle,
    outlineRow: input.outlineRow,
    content: input.content,
  });

  return { prompt, systemInstruction: getSystem("editor") };
}
