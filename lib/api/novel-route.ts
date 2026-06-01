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
  const errorName = error instanceof Error ? error.name : undefined;
  const constructorName =
    error &&
    typeof error === "object" &&
    "constructor" in error &&
    typeof (error as { constructor?: { name?: unknown } }).constructor?.name ===
      "string"
      ? ((error as { constructor: { name: string } }).constructor
          .name as string)
      : undefined;

  const isValidationError =
    error instanceof ValidationError ||
    errorName === "ValidationError" ||
    constructorName === "ValidationError";
  if (isValidationError) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 },
    );
  }

  const isNotFoundError =
    error instanceof NotFoundError ||
    errorName === "NotFoundError" ||
    constructorName === "NotFoundError";
  if (isNotFoundError) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Not found" },
      { status: 404 },
    );
  }

  throw error;
}
