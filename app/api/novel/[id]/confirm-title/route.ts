import { NextRequest, NextResponse } from "next/server";

import { confirmWizardTitle } from "../../../../../lib/novels/wizard-service";
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
