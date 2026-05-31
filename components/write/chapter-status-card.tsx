"use client";

import type { WritingWorkspaceChapterState } from "../../lib/novels/writing-workspace-state";

type ChapterStatusCardProps = {
  chapter: WritingWorkspaceChapterState;
  isActive: boolean;
};

function getStatusTone(status: WritingWorkspaceChapterState["status"]) {
  switch (status) {
    case "completed":
      return "write-status-completed";
    case "failed":
      return "write-status-failed";
    case "writing":
      return "write-status-writing";
    case "validating":
      return "write-status-validating";
    default:
      return "write-status-pending";
  }
}

function getLengthProgress(content: string) {
  return Math.min(100, Math.round((content.length / 3000) * 100));
}

export function ChapterStatusCard({
  chapter,
  isActive,
}: ChapterStatusCardProps) {
  return (
    <article
      className={`write-chapter-card ${isActive ? "write-chapter-card-active" : ""}`}
    >
      <div className="write-chapter-topline">
        <span className="plan-chip">Chapter {chapter.chapterNumber}</span>
        <span className={`write-status-pill ${getStatusTone(chapter.status)}`}>
          {chapter.status.replace("_", " ")}
        </span>
      </div>

      <h3>{chapter.title}</h3>
      <p className="write-chapter-outline">{chapter.outlineSummary}</p>

      <div className="write-progress-meta">
        <span>Live Count</span>
        <strong>{chapter.content.length}</strong>
      </div>
      <div className="write-progress-rail" aria-hidden="true">
        <div
          className="write-progress-fill"
          style={{ width: `${getLengthProgress(chapter.content)}%` }}
        />
      </div>

      <dl className="write-chapter-metrics">
        <div>
          <dt>Word Target</dt>
          <dd>{chapter.wordCountValid ? "Ready" : "Growing"}</dd>
        </div>
        <div>
          <dt>Suspense</dt>
          <dd>{chapter.suspenseValid ? "Detected" : "Pending"}</dd>
        </div>
        <div>
          <dt>Retries</dt>
          <dd>{chapter.retryCount}</dd>
        </div>
      </dl>

      {chapter.validationLog ? (
        <p className="write-validation-log">{chapter.validationLog}</p>
      ) : null}
    </article>
  );
}
