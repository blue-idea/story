import { interpolate, loadTemplate } from "../prompts";
import type { NovelStatus } from "../../db/schema";
import { polishSelectedText } from "../writer/polish";
import { NotFoundError, ValidationError } from "./errors";
import {
  findChapterByNumber,
  findOwnedNovel,
  getNovelPlan,
  getNovelReaderChapters,
  type ReadableChapterRecord,
  updateChapterContent,
} from "./repository";

export type ReadableNovelPayload = {
  novelTitle: string;
  status: NovelStatus;
  chapters: ReadableChapterRecord[];
};

function ensureChapterNumber(chapterNumber: number) {
  if (!Number.isInteger(chapterNumber) || chapterNumber <= 0) {
    throw new ValidationError("Invalid chapterNumber");
  }
}

function ensureString(value: unknown, fieldName: string): string {
  if (typeof value !== "string") {
    throw new ValidationError(`Invalid ${fieldName}`);
  }

  return value;
}

async function requireOwnedNovel(userId: string, novelId: string) {
  const novel = await findOwnedNovel(userId, novelId);

  if (!novel) {
    throw new NotFoundError("Novel not found");
  }

  return novel;
}

function formatCharacterProfiles(
  profiles: Array<{ name: string; role: string; summary: string }>,
): string {
  if (profiles.length === 0) {
    return "_No character profiles available._";
  }

  return profiles
    .map(
      (profile) =>
        `### ${profile.name}\n- Role: ${profile.role}\n- Summary: ${profile.summary}`,
    )
    .join("\n\n");
}

function formatChaptersBody(
  chapters: Array<{
    chapterNumber: number;
    title: string;
    content: string;
  }>,
): string {
  if (chapters.length === 0) {
    return "_No chapters available._";
  }

  return chapters
    .map(
      (chapter) =>
        `## 第${chapter.chapterNumber}章 ${chapter.title}\n\n${chapter.content}`,
    )
    .join("\n\n---\n\n");
}

function sanitizeFilename(title: string): string {
  const sanitized = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ").trim();
  return sanitized ? `${sanitized}.md` : "novel.md";
}

export async function loadReadableNovel(input: {
  userId: string;
  novelId: string;
}): Promise<ReadableNovelPayload> {
  const novel = await requireOwnedNovel(input.userId, input.novelId);
  const chapters = await getNovelReaderChapters(input.novelId);

  return {
    novelTitle: novel.title,
    status: novel.status,
    chapters,
  };
}

export async function saveChapterContent(input: {
  userId: string;
  novelId: string;
  chapterNumber: number;
  content: unknown;
}) {
  await requireOwnedNovel(input.userId, input.novelId);
  ensureChapterNumber(input.chapterNumber);

  const content = ensureString(input.content, "content");
  const wordCount = content.length;

  const updated = await updateChapterContent({
    novelId: input.novelId,
    chapterNumber: input.chapterNumber,
    content,
    wordCount,
  });

  if (!updated) {
    throw new NotFoundError("Chapter not found");
  }

  return {
    success: true,
    newWordCount: wordCount,
  };
}

export async function polishChapterSelection(input: {
  userId: string;
  novelId: string;
  chapterNumber: number;
  selectedText: unknown;
  surroundingContext?: unknown;
}) {
  await requireOwnedNovel(input.userId, input.novelId);
  ensureChapterNumber(input.chapterNumber);

  const selectedText = ensureString(input.selectedText, "selectedText");
  if (!selectedText.trim()) {
    throw new ValidationError("Invalid selectedText");
  }

  const chapter = await findChapterByNumber({
    novelId: input.novelId,
    chapterNumber: input.chapterNumber,
  });

  if (!chapter) {
    throw new NotFoundError("Chapter not found");
  }

  const surroundingContext =
    input.surroundingContext === undefined
      ? ""
      : ensureString(input.surroundingContext, "surroundingContext");

  return {
    polishedText: await polishSelectedText({
      selectedText,
      surroundingContext,
    }),
  };
}

export async function exportNovelMarkdown(input: {
  userId: string;
  novelId: string;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);
  const plan = await getNovelPlan(input.novelId);

  if (!plan) {
    throw new NotFoundError("Novel plan not found");
  }

  const chapters = await getNovelReaderChapters(input.novelId);
  const template = loadTemplate("export-novel");
  const content = interpolate(template, {
    title: novel.title,
    genre: novel.coreConfig.genre,
    chapterCount: novel.customConfig.chapterCount,
    characterProfiles: formatCharacterProfiles(plan.characterProfiles),
    outline: plan.outline,
    chaptersBody: formatChaptersBody(chapters),
  });

  return {
    filename: sanitizeFilename(novel.title),
    content,
  };
}
