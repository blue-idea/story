import { NextResponse } from "next/server";

import { auth } from "../../../../lib/auth";

export async function GET() {
  const session = await auth();

  return NextResponse.json(session);
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
  });
}
