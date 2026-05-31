export const HOME_ACTIVE_NOVEL_STATUSES = ["planning", "in_progress"] as const;

export type HomeActiveNovelStatus = (typeof HOME_ACTIVE_NOVEL_STATUSES)[number];

export const HOME_PROGRESS_BY_STATUS: Record<HomeActiveNovelStatus, number> = {
  planning: 32,
  in_progress: 68,
};
