"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { ChapterOutlineCard } from "./chapter-outline-card";
import { CharacterCard } from "./character-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  const [activeTab, setActiveTab] = useState<"outline" | "chapters">("outline");

  return (
    <main className="plan-page-shell">
      <section className="plan-hero-card">
        <div className="plan-hero-copy">
          <p className="plan-kicker">第二阶段</p>
          <h1>自动写作前大纲确认</h1>
          <p>
            在启动串行写作引擎前，审查完整大纲，微调章节大纲，并锁定大纲计划。
          </p>
        </div>

        <div className="plan-hero-actions">
          <button
            className="plan-primary-button plan-primary-button-glow plan-primary-button-large"
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
                  setError("启动写作失败。");
                }
              });
            }}
            type="button"
          >
            {isPending ? "启动中..." : "确认并开始写作"}
          </button>
          {error ? <p className="plan-error-text">{error}</p> : null}
        </div>
      </section>

      <div className="plan-tabs-container">
        <button
          className={`plan-tab-trigger ${activeTab === "outline" ? "active" : ""}`}
          onClick={() => setActiveTab("outline")}
          type="button"
        >
          大纲与人设
        </button>
        <button
          className={`plan-tab-trigger ${activeTab === "chapters" ? "active" : ""}`}
          onClick={() => setActiveTab("chapters")}
          type="button"
        >
          章节剧情概要
        </button>
      </div>

      {activeTab === "outline" ? (
        <div className="plan-tab-content plan-fade-in" key="outline">
          <section className="plan-main-grid">
            <article className="plan-outline-panel">
              <div className="plan-section-heading">
                <p className="plan-kicker">完整大纲</p>
                <h2>故事结构</h2>
              </div>
              <div className="plan-outline-markdown-container">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {outline}
                </ReactMarkdown>
              </div>
            </article>

            <aside className="plan-side-stack">
              <section className="plan-side-panel">
                <div className="plan-section-heading">
                  <p className="plan-kicker">登场角色</p>
                  <h2>人设卡片</h2>
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
        </div>
      ) : (
        <div className="plan-tab-content plan-fade-in" key="chapters">
          <section className="plan-chapter-section">
            <div className="plan-section-heading">
              <p className="plan-kicker">章节计划</p>
              <h2>章节剧情概要</h2>
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
        </div>
      )}
    </main>
  );
}
