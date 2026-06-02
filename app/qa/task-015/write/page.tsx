import { notFound } from "next/navigation";

export default function Task015PreviewWritePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="write-placeholder-shell">
      <section className="write-placeholder-card">
        <p className="plan-kicker">TASK-015 QA</p>
        <h1>已到达写作工作台预览。</h1>
        <p>此预览路由确认了大纲审查操作可以顺利过渡到下一个写作界面。</p>
      </section>
    </main>
  );
}
