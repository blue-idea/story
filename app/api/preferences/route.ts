import { NextResponse, NextRequest } from "next/server";
import { auth } from "../../../lib/auth";
import { db } from "../../../db";
import { userPreferences } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const pref = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });

  const activeNovel = await db.query.novels.findFirst({
    where: (novels, { and, eq, inArray }) =>
      and(
        eq(novels.userId, userId),
        inArray(novels.status, ["in_progress", "failed", "planning"]),
      ),
    orderBy: (novels, { desc }) => [desc(novels.updatedAt)],
  });

  return NextResponse.json({
    preferences: pref?.preferences || {
      preferredGenres: [],
      defaultTone: null,
      defaultChapterCount: null,
    },
    lastActiveNovel: activeNovel
      ? {
          id: activeNovel.id,
          title: activeNovel.title,
          status: activeNovel.status,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();

  const payload = {
    preferredGenres: Array.isArray(body.preferredGenres)
      ? body.preferredGenres
      : [],
    defaultTone: typeof body.defaultTone === "string" ? body.defaultTone : null,
    defaultChapterCount:
      typeof body.defaultChapterCount === "number"
        ? body.defaultChapterCount
        : null,
  };

  await db
    .insert(userPreferences)
    .values({
      userId,
      preferences: payload,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { preferences: payload, updatedAt: new Date() },
    });

  return NextResponse.json({ success: true });
}
