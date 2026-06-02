import { NovelWizard } from "../../../components/novel-wizard/novel-wizard";

export default function Task014PreviewPage() {
  return (
    <NovelWizard
      initialPreferences={{
        preferredGenres: ["科幻未来", "悬疑推理"],
        defaultTone: "轻松幽默",
        defaultChapterCount: 20,
      }}
      qaNextHref="/qa/task-019/plan"
      qaMode
    />
  );
}
