function formatSseEvent(event: string, data: Record<string, unknown>) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

type TimedEvent = {
  delayMs: number;
  event: string;
  data: Record<string, unknown>;
};

function buildInitialAttempt(): TimedEvent[] {
  return [
    {
      delayMs: 50,
      event: "chapter_start",
      data: { chapterNumber: 1, status: "writing" },
    },
    {
      delayMs: 120,
      event: "content_chunk",
      data: {
        chapterNumber: 1,
        chunk:
          "Rain pressed against the tower glass while Lin Xia cleaned the static from a stolen archive feed. ",
      },
    },
    {
      delayMs: 210,
      event: "validation_start",
      data: { chapterNumber: 1, status: "validating" },
    },
    {
      delayMs: 260,
      event: "validation_result",
      data: {
        chapterNumber: 1,
        passed: true,
        wordCountValid: true,
        suspenseValid: true,
        retryCount: 0,
        diagnosticLog: null,
      },
    },
    {
      delayMs: 320,
      event: "chapter_complete",
      data: {
        chapterNumber: 1,
        status: "completed",
        content:
          "Rain pressed against the tower glass while Lin Xia cleaned the static from a stolen archive feed.",
      },
    },
    {
      delayMs: 430,
      event: "chapter_start",
      data: { chapterNumber: 2, status: "writing" },
    },
    {
      delayMs: 520,
      event: "content_chunk",
      data: {
        chapterNumber: 2,
        chunk:
          "The archive room opened with a groan, but the emergency lights died before she found the sealed ledger. ",
      },
    },
    {
      delayMs: 610,
      event: "validation_start",
      data: { chapterNumber: 2, status: "validating" },
    },
    {
      delayMs: 680,
      event: "validation_result",
      data: {
        chapterNumber: 2,
        passed: false,
        wordCountValid: false,
        suspenseValid: true,
        retryCount: 2,
        diagnosticLog: "Need a stronger bridge scene before the blackout.",
      },
    },
    {
      delayMs: 760,
      event: "error",
      data: {
        chapterNumber: 2,
        status: "failed",
        message: "Upstream provider timeout",
      },
    },
  ];
}

function buildRetryAttempt(): TimedEvent[] {
  return [
    {
      delayMs: 50,
      event: "chapter_start",
      data: { chapterNumber: 2, status: "writing" },
    },
    {
      delayMs: 120,
      event: "content_chunk",
      data: {
        chapterNumber: 2,
        chunk:
          "On the second pass, Lin Xia mapped the blackout to a hidden maintenance relay and found the unsigned ledger page. ",
      },
    },
    {
      delayMs: 210,
      event: "validation_start",
      data: { chapterNumber: 2, status: "validating" },
    },
    {
      delayMs: 260,
      event: "validation_result",
      data: {
        chapterNumber: 2,
        passed: true,
        wordCountValid: true,
        suspenseValid: true,
        retryCount: 0,
        diagnosticLog: null,
      },
    },
    {
      delayMs: 320,
      event: "chapter_complete",
      data: {
        chapterNumber: 2,
        status: "completed",
        content:
          "On the second pass, Lin Xia mapped the blackout to a hidden maintenance relay and found the unsigned ledger page.",
      },
    },
    {
      delayMs: 430,
      event: "chapter_start",
      data: { chapterNumber: 3, status: "writing" },
    },
    {
      delayMs: 510,
      event: "content_chunk",
      data: {
        chapterNumber: 3,
        chunk:
          "At dawn, the final broadcast carried the missing confession and turned the city square silent for one breathless second. ",
      },
    },
    {
      delayMs: 610,
      event: "validation_start",
      data: { chapterNumber: 3, status: "validating" },
    },
    {
      delayMs: 660,
      event: "validation_result",
      data: {
        chapterNumber: 3,
        passed: true,
        wordCountValid: true,
        suspenseValid: true,
        retryCount: 0,
        diagnosticLog: null,
      },
    },
    {
      delayMs: 720,
      event: "chapter_complete",
      data: {
        chapterNumber: 3,
        status: "completed",
        content:
          "At dawn, the final broadcast carried the missing confession and turned the city square silent for one breathless second.",
      },
    },
    {
      delayMs: 800,
      event: "novel_complete",
      data: {
        novelId: "qa-task-016",
        status: "completed",
      },
    },
  ];
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  const { searchParams } = new URL(request.url);
  const streamRun = Number(searchParams.get("streamRun") ?? "0");
  const timeline = streamRun > 0 ? buildRetryAttempt() : buildInitialAttempt();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const timers = timeline.map((item) =>
        setTimeout(() => {
          controller.enqueue(
            encoder.encode(formatSseEvent(item.event, item.data)),
          );

          if (item.event === "error" || item.event === "novel_complete") {
            controller.close();
          }
        }, item.delayMs),
      );

      const finalTimer = setTimeout(
        () => {
          controller.close();
        },
        timeline.at(-1)?.delayMs ?? 1000,
      );

      return () => {
        timers.forEach((timer) => clearTimeout(timer));
        clearTimeout(finalTimer);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}
