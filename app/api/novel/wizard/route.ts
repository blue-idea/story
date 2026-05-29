import { NextRequest, NextResponse } from "next/server";

import { createWizardDraft } from "../../../../lib/novels/wizard-service";
import {
  handleNovelRouteError,
  requireUserId,
  unauthorizedResponse,
} from "../../../../lib/api/novel-route";

export async function POST(request: NextRequest) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const result = await createWizardDraft({
      userId,
      coreConfig: body.coreConfig,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
