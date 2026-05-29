import {
  handleNovelRouteError,
  readNovelId,
  requireUserId,
  type NovelRouteContext,
  unauthorizedResponse,
} from "../../../../../../lib/api/novel-route";
import { streamNovelWriting } from "../../../../../../lib/novels/writing-service";

export async function GET(_request: Request, context: NovelRouteContext) {
  const userId = await requireUserId();

  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const novelId = await readNovelId(context);
    return await streamNovelWriting({
      userId,
      novelId,
    });
  } catch (error) {
    return handleNovelRouteError(error);
  }
}
