import { and, desc, eq, inArray } from "drizzle-orm";

import {
  HOME_ACTIVE_NOVEL_STATUSES,
  HOME_PROGRESS_BY_STATUS,
} from "../../config/home";
import { db } from "../../db";
import {
  novels,
  userPreferences,
  type UserPreferencesPayload,
} from "../../db/schema";

type HomeActiveNovelStatus = (typeof HOME_ACTIVE_NOVEL_STATUSES)[number];

export type HomeActiveNovel = {
  id: string;
  title: string;
  status: HomeActiveNovelStatus;
  continuePath: string;
  progressPercent: number;
  lastEditedAt: Date;
};

export type HomeDashboardData = {
  preferences: UserPreferencesPayload;
  lastActiveNovel: HomeActiveNovel | null;
};

const FALLBACK_PREFERENCES: UserPreferencesPayload = {
  preferredGenres: [],
  defaultTone: null,
  defaultChapterCount: null,
};

function resolveContinuePath(input: {
  novelId: string;
  status: HomeActiveNovelStatus;
}): string {
  if (input.status === "planning") {
    return `/novel/${input.novelId}/plan`;
  }

  return `/novel/${input.novelId}/write`;
}

export async function loadHomeDashboard(
  userId: string,
): Promise<HomeDashboardData> {
  const [preferencesRecord, activeNovel] = await Promise.all([
    db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    }),
    db.query.novels.findFirst({
      where: and(
        eq(novels.userId, userId),
        inArray(novels.status, HOME_ACTIVE_NOVEL_STATUSES),
      ),
      orderBy: [desc(novels.updatedAt)],
    }),
  ]);

  if (!activeNovel) {
    return {
      preferences: preferencesRecord?.preferences ?? FALLBACK_PREFERENCES,
      lastActiveNovel: null,
    };
  }

  const activeStatus = activeNovel.status as HomeActiveNovelStatus;

  return {
    preferences: preferencesRecord?.preferences ?? FALLBACK_PREFERENCES,
    lastActiveNovel: {
      id: activeNovel.id,
      title: activeNovel.title,
      status: activeStatus,
      continuePath: resolveContinuePath({
        novelId: activeNovel.id,
        status: activeStatus,
      }),
      progressPercent: HOME_PROGRESS_BY_STATUS[activeStatus],
      lastEditedAt: activeNovel.updatedAt,
    },
  };
}
