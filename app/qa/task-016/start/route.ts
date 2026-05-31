import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    novelId: "qa-task-016",
    status: "in_progress",
  });
}
