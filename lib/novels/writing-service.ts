import { generateNovel } from "../writer/generator";
import { NotFoundError, ValidationError } from "./errors";
import { findOwnedNovel, resetNovelForWriting } from "./repository";

function formatSseEvent(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function requireOwnedNovel(userId: string, novelId: string) {
  const novel = await findOwnedNovel(userId, novelId);

  if (!novel) {
    throw new NotFoundError("Novel not found");
  }

  return novel;
}

export async function startNovelWriting(input: {
  userId: string;
  novelId: string;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);

  if (novel.status !== "planning") {
    throw new ValidationError("Novel is not ready for writing");
  }

  await resetNovelForWriting(input.novelId);

  return {
    novelId: input.novelId,
    status: "in_progress" as const,
  };
}

export async function streamNovelWriting(input: {
  userId: string;
  novelId: string;
}) {
  const novel = await requireOwnedNovel(input.userId, input.novelId);

  if (novel.status !== "in_progress") {
    throw new ValidationError("Novel is not currently writing");
  }

  const encoder = new TextEncoder();
  let activeChapterNumber: number | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(formatSseEvent(event, data)));
      };

      void generateNovel(input.novelId, {
        onChapterStart(chapterNumber) {
          activeChapterNumber = chapterNumber;
          push("chapter_start", {
            chapterNumber,
            status: "writing",
          });
        },
        onContentChunk(chapterNumber, chunk) {
          push("content_chunk", {
            chapterNumber,
            chunk,
          });
        },
        onValidationStart(chapterNumber) {
          push("validation_start", {
            chapterNumber,
            status: "validating",
          });
        },
        onValidationResult(chapterNumber, result, retryCount) {
          push("validation_result", {
            chapterNumber,
            passed: result.passed,
            wordCountValid: result.wordCountValid,
            suspenseValid: result.suspenseValid,
            retryCount,
            diagnosticLog: result.diagnosticLog ?? null,
          });
        },
        onChapterComplete(chapterNumber, content) {
          push("chapter_complete", {
            chapterNumber,
            status: "completed",
            content,
          });
        },
        onError(error) {
          push("error", {
            chapterNumber: activeChapterNumber,
            status: "failed",
            message: error.message,
          });
        },
        onNovelComplete() {
          push("novel_complete", {
            novelId: input.novelId,
            status: "completed",
          });
        },
      })
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          push("error", {
            chapterNumber: activeChapterNumber,
            status: "failed",
            message,
          });
        })
        .finally(() => {
          controller.close();
        });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
