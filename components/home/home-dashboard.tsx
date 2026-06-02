import Link from "next/link";

import type { HomeDashboardData } from "../../lib/home/home-service";

type HomeDashboardProps = {
  dashboard: HomeDashboardData;
  startHref?: string;
};

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

function formatPreferredGenres(genres: string[]): string {
  if (genres.length === 0) {
    return "无偏好";
  }

  return genres.join(" · ");
}

export function HomeDashboard({
  dashboard,
  startHref = "/novel/new",
}: HomeDashboardProps) {
  const activeNovel = dashboard.lastActiveNovel;

  return (
    <main className="home-page-shell">
      <section className="home-page-frame">
        <header className="home-hero-card">
          <div>
            <p className="home-kicker">欢迎回来</p>
            <h1>继续您的故事轨道</h1>
            <p>继续上一个项目，或一键开启一个全新的故事世界。</p>
          </div>
          <Link className="home-start-button" href={startHref}>
            开始新小说
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
            <span>默认基调</span>
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

        {activeNovel ? (
          <section className="home-continue-card">
            <div className="home-continue-headline">
              <p className="home-kicker">进行中的项目</p>
              <h2>{activeNovel.title}</h2>
              <p>
                已完成 {activeNovel.progressPercent}% · 上次编辑于{" "}
                {dateFormatter.format(activeNovel.lastEditedAt)}
              </p>
            </div>
            <div className="home-continue-rail">
              <div
                className="home-continue-fill"
                style={{ width: `${activeNovel.progressPercent}%` }}
              />
            </div>
            <Link
              className="home-continue-button"
              href={activeNovel.continuePath}
            >
              继续创作
            </Link>
          </section>
        ) : (
          <section className="home-empty-card">
            <p className="home-kicker">暂无进行中的项目</p>
            <h2>空白画布已就绪</h2>
            <p>灵感降临时，开启一个新故事吧。</p>
          </section>
        )}
      </section>
    </main>
  );
}
