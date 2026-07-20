import { NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { identifier?: unknown; password?: unknown };
    const identifier = typeof body.identifier === "string" ? body.identifier : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || !password) return NextResponse.json({ error: "Email or phone and password are required." }, { status: 400 });
    const result = await login(identifier, password);
    if (!result.ok) return NextResponse.json({ error: result.message }, { status: 401 });
    return NextResponse.json({ ok: true, destination: result.destination });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login failed." }, { status: 400 });
  }
}
