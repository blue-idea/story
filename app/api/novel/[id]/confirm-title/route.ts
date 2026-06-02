import { NextRequest, NextResponse } from "next/server";

import {
  confirmWizardTitle,
  confirmWizardTitleStream,
} from "../../../../../lib/novels/wizard-service";
import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../lib/api/novel-route";

export async function POST(request: NextRequest, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const body = await request.json();
    const url = new URL(request.url);
    const useStream = url.searchParams.get("stream") === "true";

    if (useStream) {
      const encoder = new TextEncoder();
      const customStream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: Record<string, unknown>) => {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
          };

          try {
            const streamGen = confirmWizardTitleStream({
              userId,
              novelId,
              title: body.title,
            });

            for await (const entry of streamGen) {
              sendEvent(entry.event, entry.data);
            }
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : "内部规划错误";
            sendEvent("error", { message });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(customStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const result = await confirmWizardTitle({
      userId,
      novelId,
      title: body.title,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
