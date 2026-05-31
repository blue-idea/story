import { NextResponse } from "next/server";

import { auth } from "../auth";
import { NotFoundError, ValidationError } from "../novels/errors";

export type NovelRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export type NovelChapterRouteContext = {
  params: Promise<{
    id: string;
    chapterNumber: string;
  }>;
};

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function readNovelId(context: NovelRouteContext): Promise<string> {
  const { id } = await context.params;
  return id;
}

export async function readNovelChapterParams(
  context: NovelChapterRouteContext,
): Promise<{
  novelId: string;
  chapterNumber: number;
}> {
  const { id, chapterNumber } = await context.params;

  return {
    novelId: id,
    chapterNumber: Number(chapterNumber),
  };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function handleNovelRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  throw error;
}
