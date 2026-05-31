import { NextRequest, NextResponse } from "next/server";

import {
  handleNovelRouteError,
  readNovelChapterParams,
  requireUserId,
  type NovelChapterRouteContext,
  unauthorizedResponse,
} from "../../../../../../lib/api/novel-route";
import { saveChapterContent } from "../../../../../../lib/novels/reader-service";

export async function PUT(
  request: NextRequest,
  context: NovelChapterRouteContext,
) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const { novelId, chapterNumber } = await readNovelChapterParams(context);
    const body = await request.json();
    const result = await saveChapterContent({
      userId,
      novelId,
      chapterNumber,
      content: body.content,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
