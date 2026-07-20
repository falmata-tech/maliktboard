import type { LucideIcon } from "lucide-react";
export function StatCard({label,value,note,icon:Icon}:{label:string;value:string|number;note:string;icon:LucideIcon}){return <div className="stat"><div className="stat-top"><span>{label}</span><Icon size={18}/></div><strong>{value}</strong><div className="stat-foot">{note}</div></div>}
