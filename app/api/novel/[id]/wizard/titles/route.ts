import { NextResponse } from "next/server";

import { generateWizardTitles } from "../../../../../../lib/novels/wizard-service";
import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../../lib/api/novel-route";

export async function POST(_request: Request, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    const result = await generateWizardTitles({
      userId,
      novelId,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
