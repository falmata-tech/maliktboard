import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { readUpload } from "@/lib/files";
import { getEvidenceForTracking, getEvidenceForUser } from "@/lib/services";

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const tracking=new URL(request.url).searchParams.get("tracking");
  let evidence=tracking?getEvidenceForTracking(tracking,id):null;
  if(!evidence){const user=await currentUser();if(user)evidence=getEvidenceForUser(user.id,id);}
  if(!evidence)return NextResponse.json({error:"Evidence not found or access is not authorized."},{status:404});
  try{
    const buffer=await readUpload(evidence.storage_path);
    return new NextResponse(new Uint8Array(buffer),{headers:{"Content-Type":evidence.mime_type,"Content-Disposition":`inline; filename*=UTF-8''${encodeURIComponent(evidence.original_name)}`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
  }catch{return NextResponse.json({error:"Evidence file is missing."},{status:404});}
}
