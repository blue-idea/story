import { notFound } from "next/navigation";

export default function Task015PreviewWritePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="write-placeholder-shell">
      <section className="write-placeholder-card">
        <p className="plan-kicker">TASK-015 QA</p>
        <h1>Writing workspace preview reached.</h1>
        <p>
          This preview route confirms that the planning review action can hand
          off into the next writing surface.
        </p>
      </section>
    </main>
  );
}
