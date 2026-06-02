import { notFound } from "next/navigation";

export default function Task019ExportPreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="write-placeholder-shell">
      <section className="write-placeholder-card">
        <p className="plan-kicker">TASK-019 QA</p>
        <h1>导出包已就绪。</h1>
        <p>
          此路由用于 Playwright 旅程测试，以验证基于重试的写作恢复后的下载行为。
        </p>
        <a className="read-export-button" href="/qa/task-019/export/download">
          导出 Markdown
        </a>
      </section>
    </main>
  );
}
