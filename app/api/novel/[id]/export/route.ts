import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../lib/api/novel-route";
import { exportNovelMarkdown } from "../../../../../lib/novels/reader-service";

export async function GET(_request: Request, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const result = await exportNovelMarkdown({
      userId,
      novelId,
    });

    return new Response(result.content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="novel.md"; filename*=UTF-8''${encodeURIComponent(result.filename)}`,
      },
    });
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
