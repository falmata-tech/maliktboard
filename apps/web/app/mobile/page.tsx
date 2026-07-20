import { requireMember } from "@/lib/auth";
import { MobileScanner } from "@/components/mobile-scanner";
export const dynamic="force-dynamic";
export default async function MobilePage(){await requireMember("READ_ONLY");return <MobileScanner/>}
