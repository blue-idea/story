import { db } from "../../db";
import { chapters, novels } from "../../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { createLLMClient } from "../llm";
import { validateChapter, ValidationResult } from "./validator";

export type GeneratorCallbacks = {
  onChapterStart?: (chapterNum: number) => void;
  onContentChunk?: (chunk: string) => void;
  onValidationStart?: (chapterNum: number) => void;
  onValidationResult?: (result: ValidationResult) => void;
  onChapterComplete?: (chapterNum: number) => void;
  onError?: (error: Error) => void;
  onNovelComplete?: () => void;
};

export async function generateNovel(
  novelId: string,
  callbacks: GeneratorCallbacks,
): Promise<void> {
  const llm = createLLMClient({ provider: "gemini" });

  try {
    // 获取需要写作的章节 (pending 或 writing)
    const pendingChapters = await db
      .select()
      .from(chapters)
      // 在单测中为了简化，我们 mock 的 orderBy 返回了结果，这里直接不用 eq() 防止依赖太多真实 orm 方法
      // 但是最好是使用真实的 where，单测中不强求全路径的话可以放宽
      // 这里我们在实际生产需要：where(and(eq(chapters.novelId, novelId), eq(chapters.status, 'pending')))
      .where(and(eq(chapters.novelId, novelId), eq(chapters.status, "pending")))
      .orderBy(asc(chapters.chapterNumber));

    // 因为在单测中 mockDb 返回可能是直接的 array，在真实环境中是一个 promise
    // 这里为了兼顾 vitest mock 和真实环境，如果 pendingChapters 未定义，则为空
    const chapterList = Array.isArray(pendingChapters)
      ? pendingChapters
      : await Promise.resolve(pendingChapters);

    for (let i = 0; i < chapterList.length; i++) {
      const chapter = chapterList[i];
      let retryCount = chapter.retryCount || 0;
      let lastDiagnostic = "";

      if (callbacks.onChapterStart)
        callbacks.onChapterStart(chapter.chapterNumber);

      // 更新章节状态为 writing
      await db
        .update(chapters)
        .set({ status: "writing" })
        .where(eq(chapters.id, chapter.id));

      while (true) {
        let content = "";
        const prompt = `请根据以下大纲生成本章小说：\n${chapter.outlineSummary}\n\n${lastDiagnostic ? "上一轮诊断意见：" + lastDiagnostic : ""}`;

        const stream = llm.generateStream({
          prompt,
          systemInstruction: "你是一个优秀的小说作者。",
        });

        for await (const chunk of stream) {
          content += chunk;
          if (callbacks.onContentChunk) callbacks.onContentChunk(chunk);
        }

        if (callbacks.onValidationStart)
          callbacks.onValidationStart(chapter.chapterNumber);

        const validation = await validateChapter(content);

        if (callbacks.onValidationResult)
          callbacks.onValidationResult(validation);

        if (validation.passed) {
          await db
            .update(chapters)
            .set({
              content,
              status: "completed",
              wordCountValid: true,
              suspenseValid: true,
              passed: true,
            })
            .where(eq(chapters.id, chapter.id));

          if (callbacks.onChapterComplete)
            callbacks.onChapterComplete(chapter.chapterNumber);
          break; // break retry loop
        } else {
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
    }

    if (callbacks.onNovelComplete) callbacks.onNovelComplete();
  } catch (error: unknown) {
    // 抛出致命错误，并将小说及当前章状态修改为 failed
    await db
      .update(novels)
      .set({ status: "failed" })
      .where(eq(novels.id, novelId));

    // 挂起所有 writing 状态的章节为 failed
    await db
      .update(chapters)
      .set({ status: "failed" })
      .where(
        and(eq(chapters.novelId, novelId), eq(chapters.status, "writing")),
      );

    if (callbacks.onError)
      callbacks.onError(
        error instanceof Error ? error : new Error(String(error)),
      );
  }
}
