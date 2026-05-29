import { redirect } from "next/navigation";

import { PlanDashboard } from "../../../../components/plan/plan-dashboard";
import { auth } from "../../../../lib/auth";
import { loadNovelPlan } from "../../../../lib/novels/wizard-service";

type PlanPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PlanPage({ params }: PlanPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const plan = await loadNovelPlan({
    userId: session.user.id,
    novelId: id,
  });

  return (
    <PlanDashboard
      chapters={plan.chapters}
      characterProfiles={plan.characterProfiles}
      novelId={id}
      outline={plan.outline}
    />
  );
}
