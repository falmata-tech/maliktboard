import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-title";
import { requireMember } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getWorkspaceSnapshot } from "@/lib/services";
export const dynamic="force-dynamic";
export default async function CustomersPage(){const ctx=await requireMember();if(!["OWNER", "ADMIN", "SUPERVISOR", "VIEWER"].includes(ctx.role))redirect("/app");const s=getWorkspaceSnapshot(ctx);return <><PageTitle eyebrow="Company relationships" title="Customers" description="Customer records are company-scoped. Account holders and guests can both own shipments."/><section className="card"><div className="table-wrap"><table className="table"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Account</th><th>Shipments</th><th>Added</th></tr></thead><tbody>{s.customers.map((c:any)=><tr key={c.id}><td><b>{c.name}</b></td><td>{c.phone}</td><td>{c.email||"—"}</td><td>{c.user_id?<span className="badge green">Registered</span>:<span className="badge">Guest</span>}</td><td>{c.shipment_count}</td><td>{formatDate(c.created_at)}</td></tr>)}</tbody></table></div></section></>}
