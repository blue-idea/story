import { db } from "../../db";
import { chapters, novelProfiles, novels } from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createDefaultLLMClient } from "../llm";
import { getOutlineSummaryLead } from "../novels/outline-summary";
import { validateChapter, ValidationResult } from "./validator";
import {
  buildChapterDraftPrompt,
  buildChapterRewritePrompt,
  buildChapterSummaryPrompt,
} from "./chapter-prompt";
import {
  buildNarrativeContext,
  type CompletedChapterMemory,
} from "./context-memory";

export type GeneratorCallbacks = {
  onChapterStart?: (chapterNum: number) => void;
  onContentChunk?: (chapterNum: number, chunk: string) => void;
  onValidationStart?: (chapterNum: number) => void;
  onValidationResult?: (
    chapterNum: number,
    result: ValidationResult,
    retryCount: number,
  ) => void;
  onChapterComplete?: (chapterNum: number, content: string) => void;
  onError?: (error: Error) => void;
  onNovelComplete?: () => void;
};

async function loadNovelProfile(novelId: string): Promise<{
  characterProfiles: (typeof novelProfiles.$inferSelect)["characterProfiles"];
  protagonist: string;
  perspective: string;
}> {
  const profileRows = await db
    .select({ characterProfiles: novelProfiles.characterProfiles })
    .from(novelProfiles)
    .where(eq(novelProfiles.novelId, novelId))
    .limit(1);

  const novelRows = await db
    .select({
      coreConfig: novels.coreConfig,
      customConfig: novels.customConfig,
    })
    .from(novels)
    .where(eq(novels.id, novelId))
    .limit(1);

  const novelRow = novelRows[0];

  return {
    characterProfiles: profileRows[0]?.characterProfiles ?? [],
    protagonist: novelRow?.coreConfig.protagonist ?? "",
    perspective: novelRow?.customConfig.perspective ?? "",
  };
}

function normalizeChapterSummary(summary: string, outlineRow: string): string {
  const normalized = summary.trim();
  if (normalized.length > 0) {
    return normalized;
  }

  return getOutlineSummaryLead(outlineRow);
}

async function loadCompletedChapterMemories(
  novelId: string,
): Promise<CompletedChapterMemory[]> {
  const completedRows = await db
    .select()
    .from(chapters)
    .where(and(eq(chapters.novelId, novelId), eq(chapters.status, "completed")))
    .orderBy(asc(chapters.chapterNumber));

  return completedRows.map((chapter) => ({
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    chapterSummary: normalizeChapterSummary(
      chapter.chapterSummary ?? "",
      chapter.outlineSummary,
    ),
    content: chapter.content,
  }));
}

export async function generateNovel(
  novelId: string,
  callbacks: GeneratorCallbacks,
): Promise<void> {
  const llm = createDefaultLLMClient();

  try {
    const { characterProfiles, protagonist, perspective } =
      await loadNovelProfile(novelId);

    const pendingChapters = await db
      .select()
      .from(chapters)
      .where(and(eq(chapters.novelId, novelId), eq(chapters.status, "pending")))
      .orderBy(asc(chapters.chapterNumber));

    const chapterList = Array.isArray(pendingChapters)
      ? pendingChapters
      : await Promise.resolve(pendingChapters);

    const completedChapters = await loadCompletedChapterMemories(novelId);

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
        const narrativeContext = buildNarrativeContext({
          outlineRow: chapter.outlineSummary,
          characterProfiles,
          perspective,
          protagonist,
          completedChapters,
        });

        const promptContext = {
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.title,
          outlineRow: chapter.outlineSummary,
          selectedProfiles: narrativeContext.selectedProfiles,
          summaryTimeline: narrativeContext.summaryTimeline,
          previousExcerpt: narrativeContext.previousExcerpt,
          perspectiveBoundary: narrativeContext.perspectiveBoundary,
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
            callbacks.onContentChunk(chapter.chapterNumber, chunk);
          }
        }

        if (callbacks.onValidationStart) {
          callbacks.onValidationStart(chapter.chapterNumber);
        }

        await db
          .update(chapters)
          .set({ status: "validating" })
          .where(eq(chapters.id, chapter.id));

        const validation = await validateChapter(
          content,
          chapter.chapterNumber,
        );

        if (callbacks.onValidationResult) {
          callbacks.onValidationResult(
            chapter.chapterNumber,
            validation,
            retryCount,
          );
        }

        if (validation.passed) {
          const {
            prompt: summaryPrompt,
            systemInstruction: summaryInstruction,
          } = buildChapterSummaryPrompt({
            chapterNumber: chapter.chapterNumber,
            chapterTitle: chapter.title,
            outlineRow: chapter.outlineSummary,
            content,
          });
          const chapterSummary = normalizeChapterSummary(
            await llm.generateText({
              prompt: summaryPrompt,
              systemInstruction: summaryInstruction,
            }),
            chapter.outlineSummary,
          );

          await db
            .update(chapters)
            .set({
              content,
              chapterSummary,
              status: "completed",
              wordCount: content.length,
              wordCountValid: true,
              suspenseValid: true,
              passed: true,
            })
            .where(eq(chapters.id, chapter.id));

          completedChapters.push({
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            chapterSummary,
            content,
          });

          if (callbacks.onChapterComplete) {
            callbacks.onChapterComplete(chapter.chapterNumber, content);
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

    await db
      .update(novels)
      .set({ status: "completed" })
      .where(eq(novels.id, novelId));

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
