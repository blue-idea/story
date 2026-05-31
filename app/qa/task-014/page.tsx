import { NovelWizard } from "../../../components/novel-wizard/novel-wizard";

export default function Task014PreviewPage() {
  return (
    <NovelWizard
      initialPreferences={{
        preferredGenres: ["Sci-Fi", "Thriller"],
        defaultTone: "Noir",
        defaultChapterCount: 24,
      }}
      qaMode
    />
  );
}
