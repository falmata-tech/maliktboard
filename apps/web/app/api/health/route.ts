import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { configurationWarnings } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    const db = getDb();
    const companies = db.prepare("SELECT COUNT(*) count FROM companies").get() as { count: number };
    return NextResponse.json({
      status: "ok",
      service: "MaliktBoard",
      database: "connected",
      companies: companies.count,
      warnings: configurationWarnings(),
      time: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ status: "error", error: error instanceof Error ? error.message : "Health check failed." }, { status: 503 });
  }
}
