import Link from "next/link";

import type { HomeDashboardData } from "../../lib/home/home-service";
import { WorkLibrary } from "./work-library";

type HomeDashboardProps = {
  dashboard: HomeDashboardData;
  startHref?: string;
  enableLocalDeleteDemo?: boolean;
};

function formatPreferredGenres(genres: string[]): string {
  if (genres.length === 0) {
    return "未设置偏好题材";
  }

  return genres.join(" · ");
}

export function HomeDashboard({
  dashboard,
  startHref = "/novel/new",
  enableLocalDeleteDemo = false,
}: HomeDashboardProps) {
  return (
    <main className="home-page-shell">
      <section className="home-page-frame">
        <header className="home-hero-card">
          <div>
            <p className="home-kicker">欢迎回来</p>
            <h1>从一个工作台管理您的所有创作。</h1>
            <p>
              无需离开首页，即可重新打开草稿、继续写作、跳转阅读或清理旧的实验。
            </p>
          </div>
          <Link className="home-start-button" href={startHref}>
            开始创作新小说
          </Link>
        </header>

        <section className="home-meta-grid">
          <article className="home-meta-card">
            <span>偏好题材</span>
            <strong>
              {formatPreferredGenres(dashboard.preferences.preferredGenres)}
            </strong>
          </article>
          <article className="home-meta-card">
            <span>默认写作基调</span>
            <strong>{dashboard.preferences.defaultTone ?? "未设置"}</strong>
          </article>
          <article className="home-meta-card">
            <span>章节目标</span>
            <strong>
              {dashboard.preferences.defaultChapterCount
                ? `${dashboard.preferences.defaultChapterCount} 章`
                : "未设置"}
            </strong>
          </article>
        </section>

        <WorkLibrary
          enableLocalDeleteDemo={enableLocalDeleteDemo}
          initialWorks={dashboard.works}
        />
      </section>
    </main>
  );
}
