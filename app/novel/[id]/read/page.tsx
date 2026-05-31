import { redirect } from "next/navigation";

import { ReadingWorkspace } from "../../../../components/read/reading-workspace";
import { auth } from "../../../../lib/auth";
import { loadReadableNovel } from "../../../../lib/novels/reader-service";

type ReadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReadPage({ params }: ReadPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const novel = await loadReadableNovel({
    userId: session.user.id,
    novelId: id,
  });

  return <ReadingWorkspace initialNovel={novel} novelId={id} />;
}
