import { NextResponse } from "next/server";

import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../lib/api/novel-route";
import { loadReadableNovel } from "../../../../../lib/novels/reader-service";

export async function GET(_request: Request, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const result = await loadReadableNovel({
      userId,
      novelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
