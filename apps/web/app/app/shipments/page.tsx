import Link from "next/link";
import { Flash } from "@/components/flash";
import { PageTitle } from "@/components/page-title";
import { StatusBadge } from "@/components/status-badge";
import { requireMember } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { getWorkspaceSnapshot } from "@/lib/services";
export const dynamic="force-dynamic";
export default async function ShipmentsPage({searchParams}:{searchParams:Promise<{success?:string;error?:string}>}){const ctx=await requireMember();const s=getWorkspaceSnapshot(ctx);const flash=await searchParams;return <><Flash {...flash}/><PageTitle eyebrow="Packages" title="Shipments" description="Every row represents one physical package, one tracking number, and one QR label."/><section className="card"><div className="table-wrap"><table className="table"><thead><tr><th>Tracking</th><th>Parties</th><th>Route</th><th>Price</th><th>Payment</th><th>Status</th><th>Created</th></tr></thead><tbody>{s.shipments.map((sh:any)=><tr key={sh.id}><td><Link className="link" href={`/app/shipments/${sh.id}`}>{sh.tracking_number}</Link><div className="muted small">{sh.contents}</div></td><td>{sh.sender_name}<div className="muted small">to {sh.receiver_name}</div></td><td>{sh.origin_label}<div className="muted small">→ {sh.destination_label}</div></td><td>{money(sh.final_amount??sh.preliminary_amount,sh.currency)}</td><td><StatusBadge value={sh.payment_status}/></td><td><StatusBadge value={sh.state}/></td><td>{formatDate(sh.created_at)}</td></tr>)}</tbody></table>{s.shipments.length===0&&<div className="empty">No shipments are visible in your assigned work scope.</div>}</div></section></>}
