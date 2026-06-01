import { notFound } from "next/navigation";

import { PlanDashboardPreview } from "../../../../components/plan/plan-dashboard-preview";
import {
  PREVIEW_CHARACTER_PROFILES,
  PREVIEW_CHAPTERS,
  PREVIEW_OUTLINE,
} from "../../task-015/preview-data";

export default function Task019PlanPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <PlanDashboardPreview
      chapters={PREVIEW_CHAPTERS}
      characterProfiles={PREVIEW_CHARACTER_PROFILES}
      nextWriteHref="/qa/task-016"
      outline={PREVIEW_OUTLINE}
    />
  );
}
