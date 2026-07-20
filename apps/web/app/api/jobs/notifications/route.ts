import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { deliverPendingEmails } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!env.cronSecret || authorization !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  await deliverPendingEmails(50);
  return NextResponse.json({ ok: true, processedAt: new Date().toISOString() });
}
