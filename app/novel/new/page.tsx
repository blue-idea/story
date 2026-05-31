import { redirect } from "next/navigation";

import { NovelWizard } from "../../../components/novel-wizard/novel-wizard";
import { auth } from "../../../lib/auth";
import { getUserPreferences } from "../../../lib/novels/repository";

export default async function NewNovelPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const preferences = (await getUserPreferences(session.user.id)) ?? {
    preferredGenres: [],
    defaultTone: null,
    defaultChapterCount: null,
  };

  return <NovelWizard initialPreferences={preferences} />;
}
