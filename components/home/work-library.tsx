"use client";

import { useState, useTransition } from "react";

import Link from "next/link";

import { HOME_PROGRESS_BY_STATUS } from "../../config/home";
import type { HomeWorkItem } from "../../lib/home/home-service";

type WorkLibraryProps = {
  initialWorks: HomeWorkItem[];
  enableLocalDeleteDemo?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function getStatusLabel(status: HomeWorkItem["status"]) {
  switch (status) {
    case "draft":
      return "草稿";
    case "planning":
      return "大纲";
    case "in_progress":
      return "写作中";
    case "completed":
      return "已完成";
    case "failed":
      return "已暂停";
    default: {
      const neverStatus: never = status;
      throw new Error(`Unsupported novel status: ${neverStatus}`);
    }
  }
}

function translateActionLabel(label: string) {
  switch (label.toLowerCase()) {
    case "read":
      return "阅读";
    case "edit":
      return "编辑";
    case "continue writing":
    case "continue":
      return "继续写作";
    default:
      return label;
  }
}

function getActiveWork(works: HomeWorkItem[]) {
  return (
    works.find(
      (
        work,
      ): work is HomeWorkItem & {
        status: keyof typeof HOME_PROGRESS_BY_STATUS;
      } =>
        work.status === "planning" ||
        work.status === "in_progress" ||
        work.status === "failed",
    ) ?? null
  );
}

export function WorkLibrary({
  initialWorks,
  enableLocalDeleteDemo = false,
}: WorkLibraryProps) {
  const [works, setWorks] = useState(initialWorks);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingNovelId, setPendingNovelId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeWork = getActiveWork(works);
  const activeProgress = activeWork
    ? HOME_PROGRESS_BY_STATUS[activeWork.status]
    : null;

  function removeWork(novelId: string) {
    setWorks((current) => current.filter((work) => work.id !== novelId));
  }

  function handleDelete(work: HomeWorkItem) {
    const confirmed = window.confirm(
      `确定要永久删除《${work.title}》吗？此操作无法撤销。`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);
      setPendingNovelId(work.id);

      try {
        if (enableLocalDeleteDemo) {
          removeWork(work.id);
          return;
        }

        const response = await fetch(`/api/novel/${work.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setErrorMessage(payload?.error ?? "删除作品失败。");
          return;
        }

        removeWork(work.id);
      } catch {
        setErrorMessage("删除作品失败。");
      } finally {
        setPendingNovelId(null);
      }
    });
  }

  return (
    <>
      {activeWork ? (
        <section className="home-continue-card">
          <div className="home-continue-headline">
            <p className="home-kicker">当前创作</p>
            <h2>{activeWork.title}</h2>
            <p>
              已完成 {activeProgress}% · 最近更新于{" "}
              {dateFormatter.format(new Date(activeWork.updatedAt))}
            </p>
          </div>
          <div className="home-continue-rail">
            <div
              className="home-continue-fill"
              style={{ width: `${activeProgress}%` }}
            />
          </div>
          <Link
            className="home-continue-button"
            href={activeWork.primaryActionHref}
          >
            继续创作
          </Link>
        </section>
      ) : (
        <section className="home-empty-card">
          <p className="home-kicker">无活跃作品</p>
          <h2>您的下个故事可以从这里开始。</h2>
          <p>打开草稿、回到写作，或者开始一个全新的项目。</p>
        </section>
      )}

      <section className="home-library-panel">
        <div className="home-library-header">
          <div>
            <p className="home-kicker">作品库</p>
            <h2>您的所有故事</h2>
          </div>
          <span className="home-library-count">共 {works.length} 部作品</span>
        </div>

        {errorMessage ? (
          <p className="home-library-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {works.length > 0 ? (
          <div className="home-library-grid">
            {works.map((work) => (
              <article
                className="home-work-card"
                data-novel-id={work.id}
                key={work.id}
              >
                <div className="home-work-card-top">
                  <span className={`home-work-badge status-${work.status}`}>
                    {getStatusLabel(work.status)}
                  </span>
                  <p className="home-work-updated">
                    更新于 {dateFormatter.format(new Date(work.updatedAt))}
                  </p>
                </div>

                <div className="home-work-copy">
                  <h3>{work.title}</h3>
                  <p>
                    从当前阶段 {translateActionLabel(work.primaryActionLabel)}{" "}
                    此项目。
                  </p>
                </div>

                <div className="home-work-actions">
                  <Link
                    className="home-work-primary"
                    href={work.primaryActionHref}
                  >
                    {translateActionLabel(work.primaryActionLabel)}
                  </Link>
                  <button
                    className="home-work-danger"
                    disabled={isPending && pendingNovelId === work.id}
                    onClick={() => handleDelete(work)}
                    type="button"
                  >
                    {isPending && pendingNovelId === work.id
                      ? "正在删除..."
                      : "删除"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="home-library-empty">
            <p>暂无作品。开始创作新小说以构建您的作品库。</p>
          </div>
        )}
      </section>
    </>
  );
}
