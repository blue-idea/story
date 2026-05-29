import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Implement actual preferences fetching in TASK-009
  return NextResponse.json({
    hasPreferences: false,
    unfinishedProject: null,
  });
}
