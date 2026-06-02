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
        <span className="plan-chip">第 {chapterNumber} 章</span>
        <button
          className="plan-text-button"
          onClick={() => {
            setSaved(false);
            setIsEditing((value) => !value);
          }}
          type="button"
        >
          {isEditing ? (
            "关闭"
          ) : (
            <>
              <span aria-hidden="true" className="plan-text-button-icon">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 20H8L18 10L14 6L4 16V20Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                  <path
                    d="M12 8L16 12"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.7"
                  />
                </svg>
              </span>
              <span>编辑大纲</span>
            </>
          )}
        </button>
      </div>

      <h3 className="plan-chapter-title">{title}</h3>
      <p className="plan-chapter-lead">{lead}</p>
      {saved ? <p className="plan-success-text">保存成功。</p> : null}

      {isEditing ? (
        <div className="plan-editor-block">
          <label
            className="plan-editor-label"
            htmlFor={`chapter-${chapterNumber}`}
          >
            章节大纲概要
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
                    setError("保存章节大纲失败。");
                  }
                });
              }}
              type="button"
            >
              {isPending ? "保存中..." : "保存大纲"}
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
