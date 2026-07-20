"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Boxes, CircleUserRound, ClipboardList, LayoutDashboard, MapPinned, PackageSearch, Settings, UsersRound } from "lucide-react";
import type { TeamRole } from "@maliktboard/domain";
const items=[
  ["Overview","/app",LayoutDashboard,["OWNER","ADMIN","SUPERVISOR","TEAM_MEMBER","VIEWER"]],
  ["Requests","/app/requests",ClipboardList,["OWNER","ADMIN","SUPERVISOR","VIEWER"]],
  ["Shipments","/app/shipments",PackageSearch,["OWNER","ADMIN","SUPERVISOR","TEAM_MEMBER","VIEWER"]],
  ["Batches","/app/batches",Boxes,["OWNER","ADMIN","SUPERVISOR","TEAM_MEMBER","VIEWER"]],
  ["Network","/app/network",MapPinned,["OWNER","ADMIN","SUPERVISOR","TEAM_MEMBER","VIEWER"]],
  ["Customers","/app/customers",UsersRound,["OWNER","ADMIN","SUPERVISOR","VIEWER"]],
  ["Team","/app/team",CircleUserRound,["OWNER","ADMIN"]],
  ["Analytics","/app/analytics",BarChart3,["OWNER","ADMIN","SUPERVISOR","VIEWER"]],
  ["Branding","/app/settings",Settings,["OWNER","ADMIN"]]
] as const;
export function NavLinks({role}:{role:TeamRole}){const path=usePathname();return <>{items.filter(([, , ,roles])=>roles.includes(role as never)).map(([label,href,Icon])=><Link key={href} className={`nav-link ${path===href||(href!=="/app"&&path.startsWith(href))?"active":""}`} href={href}><Icon size={18}/><span>{label}</span></Link>)}</>}
