import { redirect } from "next/navigation";

import { HomeDashboard } from "../components/home/home-dashboard";
import { auth } from "../lib/auth";
import { loadHomeDashboard } from "../lib/home/home-service";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dashboard = await loadHomeDashboard(session.user.id);
  return <HomeDashboard dashboard={dashboard} />;
}
