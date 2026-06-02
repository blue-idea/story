import { NextResponse } from "next/server";

import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../lib/api/novel-route";
import { deleteNovel } from "../../../../lib/novels/management-service";

export async function DELETE(_request: Request, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const result = await deleteNovel({
      userId,
      novelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
