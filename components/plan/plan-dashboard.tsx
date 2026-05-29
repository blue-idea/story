"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { ChapterOutlineCard } from "./chapter-outline-card";
import { CharacterCard } from "./character-card";

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

type PlanDashboardProps = {
  novelId: string;
  outline: string;
  characterProfiles: CharacterProfile[];
  chapters: ChapterPlan[];
  onConfirmWrite?: () => Promise<void>;
  onSaveOutline?: (input: {
    chapterNumber: number;
    outlineSummary: string;
  }) => Promise<void>;
};

export function PlanDashboard({
  novelId,
  outline,
  characterProfiles,
  chapters,
  onConfirmWrite,
  onSaveOutline,
}: PlanDashboardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <main className="plan-page-shell">
      <section className="plan-hero-card">
        <div className="plan-hero-copy">
          <p className="plan-kicker">PHASE 2</p>
          <h1>Outline review before automatic writing.</h1>
          <p>
            Review the full outline, adjust chapter beats, and lock the plan
            before the serial writing engine starts.
          </p>
        </div>

        <div className="plan-hero-actions">
          <button
            className="plan-primary-button plan-primary-button-large"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                setError(null);

                try {
                  if (onConfirmWrite) {
                    await onConfirmWrite();
                    return;
                  }

                  const response = await fetch(
                    `/api/novel/${novelId}/start-writing`,
                    {
                      method: "POST",
                    },
                  );

                  if (!response.ok) {
                    throw new Error("start failed");
                  }

                  router.push(`/novel/${novelId}/write`);
                } catch {
                  setError("Failed to start writing.");
                }
              });
            }}
            type="button"
          >
            {isPending ? "Starting..." : "Confirm and Write"}
          </button>
          {error ? <p className="plan-error-text">{error}</p> : null}
        </div>
      </section>

      <section className="plan-main-grid">
        <article className="plan-outline-panel">
          <div className="plan-section-heading">
            <p className="plan-kicker">FULL OUTLINE</p>
            <h2>Story architecture</h2>
          </div>
          <pre className="plan-outline-markdown">{outline}</pre>
        </article>

        <aside className="plan-side-stack">
          <section className="plan-side-panel">
            <div className="plan-section-heading">
              <p className="plan-kicker">CHARACTERS</p>
              <h2>Cast cards</h2>
            </div>
            <div className="plan-character-grid">
              {characterProfiles.map((profile) => (
                <CharacterCard
                  key={`${profile.role}-${profile.name}`}
                  name={profile.name}
                  role={profile.role}
                  summary={profile.summary}
                />
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="plan-chapter-section">
        <div className="plan-section-heading">
          <p className="plan-kicker">CHAPTER PLANS</p>
          <h2>Beat-by-beat chapter cards</h2>
        </div>
        <div className="plan-chapter-grid">
          {chapters.map((chapter) => (
            <ChapterOutlineCard
              chapterNumber={chapter.chapterNumber}
              key={chapter.chapterNumber}
              novelId={novelId}
              onSaveOutline={onSaveOutline}
              outlineSummary={chapter.outlineSummary}
              title={chapter.title}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
