import { and, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  chapters,
  novelProfiles,
  novels,
  userPreferences,
  type CharacterProfile,
  type CoreConfig,
  type CustomConfig,
  type NovelStatus,
  type UserPreferencesPayload,
} from "../../db/schema";
import type { ParsedChapter } from "../writer/planner";

export type OwnedNovel = {
  id: string;
  userId: string;
  title: string;
  status: NovelStatus;
  coreConfig: CoreConfig;
  customConfig: CustomConfig;
};

export type NovelPlanPayload = {
  outline: string;
  characterProfiles: CharacterProfile[];
  chapters: ParsedChapter[];
};

export type NovelPlanRecord = NovelPlanPayload;

export async function getUserPreferences(
  userId: string,
): Promise<UserPreferencesPayload | null> {
  const record = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  });

  return record?.preferences ?? null;
}

export async function createNovelDraft(input: {
  userId: string;
  title: string;
  coreConfig: CoreConfig;
  customConfig: CustomConfig;
}): Promise<OwnedNovel> {
  const [created] = await db
    .insert(novels)
    .values({
      userId: input.userId,
      title: input.title,
      status: "draft",
      coreConfig: input.coreConfig,
      customConfig: input.customConfig,
    })
    .returning({
      id: novels.id,
      userId: novels.userId,
      title: novels.title,
      status: novels.status,
      coreConfig: novels.coreConfig,
      customConfig: novels.customConfig,
    });

  return created;
}

export async function findOwnedNovel(
  userId: string,
  novelId: string,
): Promise<OwnedNovel | null> {
  const record = await db.query.novels.findFirst({
    where: and(eq(novels.id, novelId), eq(novels.userId, userId)),
  });

  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    status: record.status,
    coreConfig: record.coreConfig,
    customConfig: record.customConfig,
  };
}

export async function updateNovelCustomConfig(
  novelId: string,
  customConfig: CustomConfig,
): Promise<OwnedNovel> {
  const [updated] = await db
    .update(novels)
    .set({
      customConfig,
      updatedAt: new Date(),
    })
    .where(eq(novels.id, novelId))
    .returning({
      id: novels.id,
      userId: novels.userId,
      title: novels.title,
      status: novels.status,
      coreConfig: novels.coreConfig,
      customConfig: novels.customConfig,
    });

  return updated;
}

export async function updateNovelTitleAndStatus(
  novelId: string,
  title: string,
  status: NovelStatus,
): Promise<OwnedNovel> {
  const [updated] = await db
    .update(novels)
    .set({
      title,
      status,
      updatedAt: new Date(),
    })
    .where(eq(novels.id, novelId))
    .returning({
      id: novels.id,
      userId: novels.userId,
      title: novels.title,
      status: novels.status,
      coreConfig: novels.coreConfig,
      customConfig: novels.customConfig,
    });

  return updated;
}

export async function saveNovelPlan(
  novelId: string,
  plan: NovelPlanPayload,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(novelProfiles)
      .values({
        novelId,
        outline: plan.outline,
        characterProfiles: plan.characterProfiles,
      })
      .onConflictDoUpdate({
        target: novelProfiles.novelId,
        set: {
          outline: plan.outline,
          characterProfiles: plan.characterProfiles,
          updatedAt: new Date(),
        },
      });

    await tx.delete(chapters).where(eq(chapters.novelId, novelId));

    if (plan.chapters.length > 0) {
      await tx.insert(chapters).values(
        plan.chapters.map((chapter) => ({
          novelId,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          outlineSummary: chapter.outlineSummary,
        })),
      );
    }
  });
}

export async function getNovelPlan(
  novelId: string,
): Promise<NovelPlanRecord | null> {
  const profile = await db.query.novelProfiles.findFirst({
    where: eq(novelProfiles.novelId, novelId),
  });

  if (!profile) {
    return null;
  }

  const chapterRecords = await db.query.chapters.findMany({
    where: eq(chapters.novelId, novelId),
    orderBy: (table, { asc }) => [asc(table.chapterNumber)],
  });

  return {
    outline: profile.outline,
    characterProfiles: profile.characterProfiles,
    chapters: chapterRecords.map((chapter) => ({
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      outlineSummary: chapter.outlineSummary,
    })),
  };
}

export async function updateChapterOutline(input: {
  novelId: string;
  chapterNumber: number;
  outlineSummary: string;
}): Promise<boolean> {
  const updated = await db
    .update(chapters)
    .set({
      outlineSummary: input.outlineSummary,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(chapters.novelId, input.novelId),
        eq(chapters.chapterNumber, input.chapterNumber),
      ),
    )
    .returning({
      id: chapters.id,
    });

  return updated.length > 0;
}

export async function resetNovelForWriting(novelId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(novels)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(novels.id, novelId));

    await tx
      .update(chapters)
      .set({
        status: "pending",
        content: "",
        wordCount: 0,
        wordCountValid: false,
        suspenseValid: false,
        passed: false,
        retryCount: 0,
        validationLog: null,
        updatedAt: new Date(),
      })
      .where(eq(chapters.novelId, novelId));
  });
}
