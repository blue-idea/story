import { NextRequest, NextResponse } from "next/server";

import {
  loadNovelPlan,
  saveChapterOutlineSummary,
} from "../../../../../lib/novels/wizard-service";
import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../lib/api/novel-route";

export async function GET(_request: Request, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const result = await loadNovelPlan({
      userId,
      novelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}

export async function PUT(request: NextRequest, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const body = await request.json();
    const result = await saveChapterOutlineSummary({
      userId,
      novelId,
      chapterNumber: body.chapterNumber,
      outlineSummary: body.outlineSummary,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
