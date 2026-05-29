"use client";

import { useState, useTransition } from "react";

import {
  getOutlineSummaryLead,
  parseOutlineSummary,
} from "../../lib/novels/outline-summary";

type ChapterOutlineCardProps = {
  chapterNumber: number;
  title: string;
  outlineSummary: string;
  novelId: string;
  onSaveOutline?: (input: {
    chapterNumber: number;
    outlineSummary: string;
  }) => Promise<void>;
};

export function ChapterOutlineCard({
  chapterNumber,
  title,
  outlineSummary,
  novelId,
  onSaveOutline,
}: ChapterOutlineCardProps) {
  const [draft, setDraft] = useState(outlineSummary);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const details = parseOutlineSummary(draft);
  const lead = getOutlineSummaryLead(draft);

  return (
    <article className="plan-chapter-card">
      <div className="plan-chapter-topline">
        <span className="plan-chip">Chapter {chapterNumber}</span>
        <button
          className="plan-text-button"
          onClick={() => {
            setSaved(false);
            setIsEditing((value) => !value);
          }}
          type="button"
        >
          {isEditing ? "Close" : "Edit Outline"}
        </button>
      </div>

      <h3 className="plan-chapter-title">{title}</h3>
      <p className="plan-chapter-lead">{lead}</p>
      {saved ? <p className="plan-success-text">Saved.</p> : null}

      {isEditing ? (
        <div className="plan-editor-block">
          <label
            className="plan-editor-label"
            htmlFor={`chapter-${chapterNumber}`}
          >
            Outline Summary
          </label>
          <textarea
            className="plan-editor-textarea"
            id={`chapter-${chapterNumber}`}
            onChange={(event) => {
              setSaved(false);
              setError(null);
              setDraft(event.target.value);
            }}
            rows={8}
            value={draft}
          />
          <div className="plan-editor-actions">
            <button
              className="plan-primary-button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  setError(null);
                  setSaved(false);

                  try {
                    if (onSaveOutline) {
                      await onSaveOutline({
                        chapterNumber,
                        outlineSummary: draft,
                      });
                    } else {
                      const response = await fetch(
                        `/api/novel/${novelId}/plan`,
                        {
                          method: "PUT",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            chapterNumber,
                            outlineSummary: draft,
                          }),
                        },
                      );

                      if (!response.ok) {
                        throw new Error("save failed");
                      }
                    }

                    setSaved(true);
                    setIsEditing(false);
                  } catch {
                    setError("Failed to save chapter outline.");
                  }
                });
              }}
              type="button"
            >
              {isPending ? "Saving..." : "Save Outline"}
            </button>
            {error ? <span className="plan-error-text">{error}</span> : null}
          </div>
        </div>
      ) : (
        <dl className="plan-outline-grid">
          {details.map((item) => (
            <div
              className="plan-outline-item"
              key={`${chapterNumber}-${item.label}`}
            >
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </article>
  );
}
