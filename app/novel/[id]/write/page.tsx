type WritePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WritePage({ params }: WritePageProps) {
  const { id } = await params;

  return (
    <main className="write-placeholder-shell">
      <section className="write-placeholder-card">
        <p className="plan-kicker">PHASE 3</p>
        <h1>Writing workspace is now armed.</h1>
        <p>
          Novel <strong>{id}</strong> has entered the automatic writing phase.
          The live terminal workspace will be expanded in the next task.
        </p>
      </section>
    </main>
  );
}
