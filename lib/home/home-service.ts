import { eq } from "drizzle-orm";

import {
  HOME_ACTIVE_NOVEL_STATUSES,
  HOME_PROGRESS_BY_STATUS,
  type HomeActiveNovelStatus,
} from "../../config/home";
import { db } from "../../db";
import {
  userPreferences,
  type NovelStatus,
  type UserPreferencesPayload,
} from "../../db/schema";

export type HomeActiveNovel = {
  id: string;
  title: string;
  status: HomeActiveNovelStatus;
  continuePath: string;
  progressPercent: number;
  lastEditedAt: string;
};

export type HomeWorkItem = {
  id: string;
  title: string;
  status: NovelStatus;
  updatedAt: string;
  primaryActionLabel: "Edit" | "Continue Writing" | "Read";
  primaryActionHref: string;
};

export type HomeDashboardData = {
  preferences: UserPreferencesPayload;
  lastActiveNovel: HomeActiveNovel | null;
  works: HomeWorkItem[];
};

const FALLBACK_PREFERENCES: UserPreferencesPayload = {
  preferredGenres: [],
  defaultTone: null,
  defaultChapterCount: null,
};

function resolvePrimaryAction(status: NovelStatus, novelId: string) {
  switch (status) {
    case "draft":
    case "planning":
      return {
        label: "Edit" as const,
        href: `/novel/${novelId}/plan`,
      };
    case "completed":
      return {
        label: "Read" as const,
        href: `/novel/${novelId}/read`,
      };
    case "in_progress":
    case "failed":
      return {
        label: "Continue Writing" as const,
        href: `/novel/${novelId}/write`,
      };
    default: {
      const neverStatus: never = status;
      throw new Error(`Unsupported novel status: ${neverStatus}`);
    }
  }
}

function isActiveNovelStatus(
  status: NovelStatus,
): status is HomeActiveNovelStatus {
  return HOME_ACTIVE_NOVEL_STATUSES.includes(status as HomeActiveNovelStatus);
}

export async function loadHomeDashboard(
  userId: string,
): Promise<HomeDashboardData> {
  const [preferencesRecord, novelRecords] = await Promise.all([
    db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    }),
    db.query.novels.findMany({
      where: (table, { eq: equals }) => equals(table.userId, userId),
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.updatedAt)],
    }),
  ]);

  const works = novelRecords.map((novel) => {
    const primaryAction = resolvePrimaryAction(novel.status, novel.id);

    return {
      id: novel.id,
      title: novel.title,
      status: novel.status,
      updatedAt: novel.updatedAt.toISOString(),
      primaryActionLabel: primaryAction.label,
      primaryActionHref: primaryAction.href,
    } satisfies HomeWorkItem;
  });

  const activeNovelRecord =
    novelRecords.find(
      (
        novel,
      ): novel is (typeof novelRecords)[number] & {
        status: HomeActiveNovelStatus;
      } => isActiveNovelStatus(novel.status),
    ) ?? null;

  return {
    preferences: preferencesRecord?.preferences ?? FALLBACK_PREFERENCES,
    lastActiveNovel: activeNovelRecord
      ? {
          id: activeNovelRecord.id,
          title: activeNovelRecord.title,
          status: activeNovelRecord.status,
          continuePath: resolvePrimaryAction(
            activeNovelRecord.status,
            activeNovelRecord.id,
          ).href,
          progressPercent: HOME_PROGRESS_BY_STATUS[activeNovelRecord.status],
          lastEditedAt: activeNovelRecord.updatedAt.toISOString(),
        }
      : null,
    works,
  };
}
