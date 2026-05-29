"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { PlanDashboard } from "./plan-dashboard";

type CharacterProfile = {
  name: string;
  role: string;
  summary: string;
};

type ChapterPlan = {
  chapterNumber: number;
  title: string;
  outlineSummary: string;
};

type PlanDashboardPreviewProps = {
  outline: string;
  characterProfiles: CharacterProfile[];
  chapters: ChapterPlan[];
};

export function PlanDashboardPreview({
  outline,
  characterProfiles,
  chapters,
}: PlanDashboardPreviewProps) {
  const router = useRouter();
  const [draftChapters, setDraftChapters] = useState(chapters);

  return (
    <PlanDashboard
      chapters={draftChapters}
      characterProfiles={characterProfiles}
      novelId="qa-preview"
      onConfirmWrite={async () => {
        router.push("/qa/task-015/write");
      }}
      onSaveOutline={async ({ chapterNumber, outlineSummary }) => {
        setDraftChapters((current) =>
          current.map((chapter) =>
            chapter.chapterNumber === chapterNumber
              ? {
                  ...chapter,
                  outlineSummary,
                }
              : chapter,
          ),
        );
      }}
      outline={outline}
    />
  );
}
