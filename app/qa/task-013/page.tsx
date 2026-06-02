import { HomeDashboard } from "../../../components/home/home-dashboard";

export default function Task013PreviewPage() {
  return (
    <HomeDashboard
      dashboard={{
        preferences: {
          preferredGenres: ["Sci-Fi", "Thriller", "Adventure"],
          defaultTone: "Noir",
          defaultChapterCount: 24,
        },
        lastActiveNovel: {
          id: "qa-task-013-planning",
          title: "Neon Meridian",
          status: "planning",
          continuePath: "/qa/task-015",
          progressPercent: 32,
          lastEditedAt: "2026-05-31T08:30:00.000Z",
        },
        works: [
          {
            id: "qa-task-013-draft",
            title: "Glass Harbour",
            status: "draft",
            updatedAt: "2026-06-03T10:30:00.000Z",
            primaryActionLabel: "Edit",
            primaryActionHref: "/qa/task-015",
          },
          {
            id: "qa-task-013-planning",
            title: "Neon Meridian",
            status: "planning",
            updatedAt: "2026-06-03T09:10:00.000Z",
            primaryActionLabel: "Edit",
            primaryActionHref: "/qa/task-015",
          },
          {
            id: "qa-task-013-writing",
            title: "Signal Choir",
            status: "in_progress",
            updatedAt: "2026-06-03T08:00:00.000Z",
            primaryActionLabel: "Continue Writing",
            primaryActionHref: "/qa/task-016",
          },
          {
            id: "qa-task-013-completed",
            title: "Archive Bloom",
            status: "completed",
            updatedAt: "2026-06-02T21:45:00.000Z",
            primaryActionLabel: "Read",
            primaryActionHref: "/qa/task-019/export",
          },
          {
            id: "qa-task-013-failed",
            title: "Broken Constellation",
            status: "failed",
            updatedAt: "2026-06-02T19:20:00.000Z",
            primaryActionLabel: "Continue Writing",
            primaryActionHref: "/qa/task-016",
          },
        ],
      }}
      enableLocalDeleteDemo
      startHref="/qa/task-014"
    />
  );
}
