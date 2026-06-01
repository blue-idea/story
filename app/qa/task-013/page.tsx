import { HomeDashboard } from "../../../components/home/home-dashboard";

export default function Task013PreviewPage() {
  return (
    <HomeDashboard
      dashboard={{
        preferences: {
          preferredGenres: ["Cyberpunk", "Thriller", "Adventure"],
          defaultTone: "Noir",
          defaultChapterCount: 24,
        },
        lastActiveNovel: {
          id: "qa-task-013",
          title: "Neon Meridian",
          status: "in_progress",
          continuePath: "/qa/task-016",
          progressPercent: 68,
          lastEditedAt: new Date("2026-05-31T08:30:00.000Z"),
        },
      }}
      startHref="/qa/task-014"
    />
  );
}
