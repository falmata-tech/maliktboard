import Link from "next/link";
import { changePasswordAction, logoutAction } from "@/app/actions";
import { Flash } from "@/components/flash";
import { requireUser } from "@/lib/auth";
export const dynamic="force-dynamic";
export default async function AccountPage({searchParams}:{searchParams:Promise<{error?:string;success?:string}>}){
  const user=await requireUser();const flash=await searchParams;
  return <main className="auth-page"><section className="auth-card"><Link className="logo" style={{padding:0,color:"#172126"}} href={user.platformRole==="ADMIN"?"/admin":"/app"}><span className="logo-mark">M</span><span>Account security</span></Link><h1>Change password</h1><p className="muted">Changing your password signs out every active session for this account.</p><Flash {...flash}/><form className="stack mt" action={changePasswordAction}><div className="field"><label>Current password</label><input className="input" name="currentPassword" type="password" autoComplete="current-password" required/></div><div className="field"><label>New password</label><input className="input" name="newPassword" type="password" minLength={12} autoComplete="new-password" required/></div><button className="btn">Change password</button></form><form className="mt" action={logoutAction}><button className="btn secondary">Sign out instead</button></form></section></main>
}
