import { redirect } from "next/navigation";

import { WritingWorkspace } from "../../../../components/write/writing-workspace";
import { auth } from "../../../../lib/auth";
import { loadWritingWorkspace } from "../../../../lib/novels/writing-service";

type WritePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function WritePage({ params }: WritePageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const workspace = await loadWritingWorkspace({
    userId: session.user.id,
    novelId: id,
  });

  return <WritingWorkspace initialWorkspace={workspace} novelId={id} />;
}
