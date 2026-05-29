import { db } from "../../db";
import { chapters, novelProfiles, novels } from "../../db/schema";
import type { CharacterProfile } from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createLLMClient } from "../llm";
import { validateChapter, ValidationResult } from "./validator";
import {
  buildChapterDraftPrompt,
  buildChapterRewritePrompt,
} from "./chapter-prompt";

export type GeneratorCallbacks = {
  onChapterStart?: (chapterNum: number) => void;
  onContentChunk?: (chunk: string) => void;
  onValidationStart?: (chapterNum: number) => void;
  onValidationResult?: (result: ValidationResult) => void;
  onChapterComplete?: (chapterNum: number) => void;
  onError?: (error: Error) => void;
  onNovelComplete?: () => void;
};

const FIRST_CHAPTER_SUMMARY = "（首章无上文）";

async function loadNovelProfile(novelId: string): Promise<{
  characterProfiles: CharacterProfile[];
}> {
  const rows = await db
    .select({ characterProfiles: novelProfiles.characterProfiles })
    .from(novelProfiles)
    .where(eq(novelProfiles.novelId, novelId))
    .limit(1);

  return {
    characterProfiles: rows[0]?.characterProfiles ?? [],
  };
}

export async function generateNovel(
  novelId: string,
  callbacks: GeneratorCallbacks,
): Promise<void> {
  const llm = createLLMClient({ provider: "gemini" });

  try {
    const { characterProfiles } = await loadNovelProfile(novelId);

    const pendingChapters = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.status, "pending")))
      .orderBy(asc(chapters.chapterNumber));

    const chapterList = Array.isArray(pendingChapters)
      ? pendingChapters
      : await Promise.resolve(pendingChapters);

    let previousChapterSummary = FIRST_CHAPTER_SUMMARY;

    for (let i = 0; i < chapterList.length; i++) {
      const chapter = chapterList[i];
      let retryCount = chapter.retryCount || 0;
      let lastDiagnostic = "";

      if (callbacks.onChapterStart) {
        callbacks.onChapterStart(chapter.chapterNumber);
      }

      await db
        .update(chapters)
        .set({ status: "writing" })
        .where(eq(chapters.id, chapter.id));

      while (true) {
        let content = "";

        const promptContext = {
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.title,
          outlineRow: chapter.outlineSummary,
          characterProfiles,
          previousChapterSummary,
          diagnosticLog: lastDiagnostic,
        };

        const { prompt, systemInstruction } =
          retryCount === 0
            ? buildChapterDraftPrompt(promptContext)
            : buildChapterRewritePrompt(promptContext);

        const stream = llm.generateStream({
          prompt,
          systemInstruction,
        });

        for await (const chunk of stream) {
          content += chunk;
          if (callbacks.onContentChunk) {
            callbacks.onContentChunk(chunk);
          }
        }

        if (callbacks.onValidationStart) {
          callbacks.onValidationStart(chapter.chapterNumber);
        }

        const validation = await validateChapter(
          content,
          chapter.chapterNumber,
        );

        if (callbacks.onValidationResult) {
          callbacks.onValidationResult(validation);
        }

        if (validation.passed) {
          await db
            .update(chapters)
            .set({
              content,
              status: "completed",
              wordCount: content.length,
              wordCountValid: true,
              suspenseValid: true,
              passed: true,
            })
            .where(eq(chapters.id, chapter.id));

          previousChapterSummary =
            content.length > 500 ? content.slice(-500) : content;

          if (callbacks.onChapterComplete) {
            callbacks.onChapterComplete(chapter.chapterNumber);
          }
          break;
        }

        retryCount++;
        if (retryCount > 3) {
          throw new Error(
            `章节 ${chapter.chapterNumber} 连续3次校验失败，达到最大重试次数。`,
          );
        }
        lastDiagnostic = validation.diagnosticLog || "未知错误";
        await db
          .update(chapters)
          .set({ retryCount })
          .where(eq(chapters.id, chapter.id));
      }
    }

    if (callbacks.onNovelComplete) {
      callbacks.onNovelComplete();
    }
  } catch (error: unknown) {
    await db
      .update(novels)
      .set({ status: "failed" })
      .where(eq(novels.id, novelId));

    await db
      .update(chapters)
      .set({ status: "failed" })
      .where(
        and(eq(chapters.novelId, novelId), eq(chapters.status, "writing")),
      );

    if (callbacks.onError) {
      callbacks.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
