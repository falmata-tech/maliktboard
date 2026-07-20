import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth";
import { resolveQr } from "@/lib/services";
export async function POST(request:Request){try{const ctx=await requireMember("READ_ONLY");const body=await request.json() as {token?:unknown};const token=typeof body.token==="string"?body.token.trim():"";if(token.length<8||token.length>500)return NextResponse.json({error:"Enter or scan a valid QR identifier."},{status:400});const result=resolveQr(ctx,token);if(!result)return NextResponse.json({error:"QR code was not found in this company workspace."},{status:404});return NextResponse.json(result);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Unauthorized"},{status:401});}}
