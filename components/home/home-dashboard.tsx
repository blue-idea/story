import Link from "next/link";

import type { HomeDashboardData } from "../../lib/home/home-service";

type HomeDashboardProps = {
  dashboard: HomeDashboardData;
  startHref?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatPreferredGenres(genres: string[]): string {
  if (genres.length === 0) {
    return "No preference";
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
            <p className="home-kicker">WELCOME BACK</p>
            <h1>Continue your story orbit.</h1>
            <p>
              Keep momentum with your last project, or spin up a brand-new
              universe in one click.
            </p>
          </div>
          <Link className="home-start-button" href={startHref}>
            Start New Novel
          </Link>
        </header>

        <section className="home-meta-grid">
          <article className="home-meta-card">
            <span>Preferred genres</span>
            <strong>
              {formatPreferredGenres(dashboard.preferences.preferredGenres)}
            </strong>
          </article>
          <article className="home-meta-card">
            <span>Default tone</span>
            <strong>{dashboard.preferences.defaultTone ?? "Not set"}</strong>
          </article>
          <article className="home-meta-card">
            <span>Chapter target</span>
            <strong>
              {dashboard.preferences.defaultChapterCount
                ? `${dashboard.preferences.defaultChapterCount} chapters`
                : "Not set"}
            </strong>
          </article>
        </section>

        {activeNovel ? (
          <section className="home-continue-card">
            <div className="home-continue-headline">
              <p className="home-kicker">ACTIVE PROJECT</p>
              <h2>{activeNovel.title}</h2>
              <p>
                {activeNovel.progressPercent}% complete · Last edited{" "}
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
              Continue Writing
            </Link>
          </section>
        ) : (
          <section className="home-empty-card">
            <p className="home-kicker">NO ACTIVE PROJECT</p>
            <h2>Fresh canvas is ready.</h2>
            <p>Start a new story when inspiration hits.</p>
          </section>
        )}
      </section>
    </main>
  );
}
