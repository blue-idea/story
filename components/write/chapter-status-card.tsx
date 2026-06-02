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

function getStatusLabel(status: WritingWorkspaceChapterState["status"]) {
  switch (status) {
    case "completed":
      return "已完成";
    case "failed":
      return "失败";
    case "writing":
      return "写作中";
    case "validating":
      return "校验中";
    default:
      return "等待中";
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
        <span className="plan-chip">第 {chapter.chapterNumber} 章</span>
        <span className={`write-status-pill ${getStatusTone(chapter.status)}`}>
          {getStatusLabel(chapter.status)}
        </span>
      </div>

      <h3>{chapter.title}</h3>
      <p className="write-chapter-outline">{chapter.outlineSummary}</p>

      <div className="write-progress-meta">
        <span>当前字数</span>
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
          <dt>字数目标</dt>
          <dd>{chapter.wordCountValid ? "达标" : "未达标"}</dd>
        </div>
        <div>
          <dt>悬念钩子</dt>
          <dd>{chapter.suspenseValid ? "已检测到" : "等待检测"}</dd>
        </div>
        <div>
          <dt>重试次数</dt>
          <dd>{chapter.retryCount}</dd>
        </div>
      </dl>

      {chapter.validationLog ? (
        <p className="write-validation-log">{chapter.validationLog}</p>
      ) : null}
    </article>
  );
}
