import { notFound } from "next/navigation";

export default function Task019ExportPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="write-placeholder-shell">
      <section className="write-placeholder-card">
        <p className="plan-kicker">TASK-019 QA</p>
        <h1>Export package is ready.</h1>
        <p>
          This route is used by Playwright journey tests to validate download
          behavior after retry-based writing recovery.
        </p>
        <a className="read-export-button" href="/qa/task-019/export/download">
          Export Markdown
        </a>
      </section>
    </main>
  );
}
