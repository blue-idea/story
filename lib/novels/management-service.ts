import { NotFoundError } from "./errors";
import { deleteOwnedNovel } from "./repository";

export async function deleteNovel(input: { userId: string; novelId: string }) {
  const deleted = await deleteOwnedNovel(input);

  if (!deleted) {
    throw new NotFoundError("Novel not found");
  }

  return {
    success: true as const,
    deletedNovelId: input.novelId,
  };
}
