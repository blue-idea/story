import { NextRequest, NextResponse } from "next/server";

import { updateWizardDraft } from "../../../../../lib/novels/wizard-service";
import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../lib/api/novel-route";

export async function PATCH(request: NextRequest, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const body = await request.json();
    const result = await updateWizardDraft({
      userId,
      novelId,
      customConfigPartial: body.customConfigPartial,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
