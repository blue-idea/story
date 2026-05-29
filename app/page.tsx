export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <section
        style={{
          width: "min(100%, 48rem)",
          padding: "2rem",
          borderRadius: "1.5rem",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.12)",
        }}
      >
        <p style={{ margin: 0, fontSize: "0.875rem", letterSpacing: "0.08em" }}>
          NOVELIST
        </p>
        <h1
          style={{
            marginBottom: "0.75rem",
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
          }}
        >
          Story workspace is ready.
        </h1>
        <p style={{ margin: 0, lineHeight: 1.7 }}>
          Next.js, Drizzle ORM, lint pipeline, and CI security checks are
          prepared for the next implementation tasks.
        </p>
      </section>
    </main>
  );
}
