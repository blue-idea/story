import { NextRequest, NextResponse } from "next/server";

import {
  handleNovelRouteError,
  readNovelChapterParams,
  requireUserId,
  type NovelChapterRouteContext,
  unauthorizedResponse,
} from "../../../../../../../lib/api/novel-route";
import { polishChapterSelection } from "../../../../../../../lib/novels/reader-service";

export async function POST(
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
    const result = await polishChapterSelection({
      userId,
      novelId,
      chapterNumber,
      selectedText: body.selectedText,
      surroundingContext: body.surroundingContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
