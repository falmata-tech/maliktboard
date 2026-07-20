"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { login, logout, requireMember, requirePlatformAdmin, setActiveCompany } from "@/lib/auth";
import {
  activateShipment, addShipmentToBatch, completeDelivery, createBatch, createCompanyByAdmin, createLocation, createRouteLeg,
  createTeamMember, customerQuoteDecision, issueQuote, receiveShipment, recordPayment, removeShipmentFromBatch,
  setCompanyStatus, startFinalDelivery, submitPublicRequest, transferShipment, transitionBatch, updateBranding,
} from "@/lib/services";
import type { BatchState } from "@maliktboard/domain";

const text=(form:FormData,key:string)=>String(form.get(key)||"").trim();
const message=(error:unknown)=>{const value=error instanceof Error?error.message:"Something went wrong.";if(/UNIQUE constraint failed/i.test(value))return "That email, phone, handle, tracking number, or code is already in use.";if(/FOREIGN KEY constraint failed/i.test(value))return "A selected record is invalid or belongs to another company.";if(/CHECK constraint failed/i.test(value))return "One of the submitted values is not allowed.";return value;};
const destination=(path:string,error?:string,success?:string)=>`${path}?${error?`error=${encodeURIComponent(error)}`:`success=${encodeURIComponent(success||"Saved.")}`}`;

export async function loginAction(form:FormData){
  const result=await login(text(form,"identifier"),text(form,"password"));
  if(!result.ok)redirect(`/login?error=${encodeURIComponent(result.message||"Login failed.")}`);
  redirect(result.destination||"/app");
}
export async function logoutAction(){await logout();redirect("/login");}
export async function switchCompanyAction(form:FormData){
  try{await setActiveCompany(text(form,"companyId"));}catch(error){redirect(destination("/app",message(error)));}
  redirect("/app");
}

export async function publicRequestAction(form:FormData){
  const handle=text(form,"handle");let result;let error;
  try{result=await submitPublicRequest(handle,form);}catch(e){error=message(e);}
  if(error)redirect(destination(`/c/${handle}/request`,error));
  redirect(`/q/${result!.quoteToken}?submitted=1`);
}

export async function quoteDecisionAction(form:FormData){
  const token=text(form,"token");let error;
  try{await customerQuoteDecision(token,text(form,"decision")==="ABANDON"?"ABANDON":"ACCEPT");}catch(e){error=message(e);}
  if(error)redirect(destination(`/q/${token}`,error));
  redirect(destination(`/q/${token}`,undefined,text(form,"decision")==="ABANDON"?"Request abandoned.":"Quote accepted. The company can now confirm your shipment."));
}

export async function issueQuoteAction(form:FormData){
  const id=text(form,"requestId");let error;
  try{const ctx=await requireMember("QUOTE_ISSUE");await issueQuote(ctx,id,Number(text(form,"amount")),text(form,"expectedDeliveryDate")||undefined,text(form,"notes")||undefined);}catch(e){error=message(e);}
  revalidatePath("/app/requests");redirect(destination("/app/requests",error,"Preliminary quote issued."));
}

export async function activateShipmentAction(form:FormData){
  const requestId=text(form,"requestId");let result;let error;
  try{const ctx=await requireMember("SHIPMENT_ACTIVATE");result=await activateShipment(ctx,requestId);}catch(e){error=message(e);}
  revalidatePath("/app");redirect(error?destination("/app/requests",error):destination(`/app/shipments/${result!.shipmentId}`,undefined,"Shipment activated."));
}

export async function receiveShipmentAction(form:FormData){
  const shipmentId=text(form,"shipmentId");let error;
  try{const ctx=await requireMember("SHIPMENT_UPDATE");receiveShipment(ctx,shipmentId,text(form,"idempotencyKey")||crypto.randomUUID());}catch(e){error=message(e);}
  revalidatePath(`/app/shipments/${shipmentId}`);redirect(destination(`/app/shipments/${shipmentId}`,error,"Shipment received."));
}

export async function createBatchAction(form:FormData){
  let batchId;let error;
  try{const ctx=await requireMember("BATCH_CREATE");batchId=createBatch(ctx,text(form,"routeLegId"),text(form,"expectedDeparture")||undefined,text(form,"expectedArrival")||undefined);}catch(e){error=message(e);}
  revalidatePath("/app/batches");redirect(error?destination("/app/batches",error):destination(`/app/batches/${batchId}`,undefined,"Dispatch Batch created."));
}

export async function addShipmentToBatchAction(form:FormData){
  const batchId=text(form,"batchId");let error;
  try{const ctx=await requireMember("BATCH_UPDATE");addShipmentToBatch(ctx,text(form,"shipmentId"),batchId,text(form,"idempotencyKey")||crypto.randomUUID());}catch(e){error=message(e);}
  revalidatePath(`/app/batches/${batchId}`);redirect(destination(`/app/batches/${batchId}`,error,"Shipment added to batch."));
}

export async function removeShipmentFromBatchAction(form:FormData){
  const batchId=text(form,"batchId");let error;
  try{const ctx=await requireMember("BATCH_UPDATE");removeShipmentFromBatch(ctx,text(form,"shipmentId"),batchId,text(form,"reason"));}catch(e){error=message(e);}
  revalidatePath(`/app/batches/${batchId}`);redirect(destination(`/app/batches/${batchId}`,error,"Shipment removed."));
}

export async function batchTransitionAction(form:FormData){
  const batchId=text(form,"batchId");const next=text(form,"next") as BatchState;let error;let summary;
  try{const ctx=await requireMember("BATCH_UPDATE");summary=transitionBatch(ctx,batchId,next,text(form,"reason")||undefined,text(form,"idempotencyKey")||crypto.randomUUID());}catch(e){error=message(e);}
  revalidatePath(`/app/batches/${batchId}`);const ok=summary?`Batch moved to ${next}. ${summary.updated} shipment(s) updated; ${summary.skipped} skipped.`:`Batch moved to ${next}.`;redirect(destination(`/app/batches/${batchId}`,error,ok));
}

export async function transferShipmentAction(form:FormData){
  const batchId=text(form,"destinationBatchId");let error;
  try{const ctx=await requireMember("BATCH_UPDATE");transferShipment(ctx,text(form,"shipmentId"),batchId,text(form,"idempotencyKey")||crypto.randomUUID());}catch(e){error=message(e);}
  revalidatePath(`/app/batches/${batchId}`);redirect(destination(`/app/batches/${batchId}`,error,"Shipment transferred."));
}

export async function startFinalDeliveryAction(form:FormData){
  const shipmentId=text(form,"shipmentId");let error;
  try{const ctx=await requireMember("SHIPMENT_UPDATE");startFinalDelivery(ctx,shipmentId);}catch(e){error=message(e);}
  revalidatePath(`/app/shipments/${shipmentId}`);redirect(destination(`/app/shipments/${shipmentId}`,error,"Shipment is out for delivery."));
}

export async function completeDeliveryAction(form:FormData){
  const shipmentId=text(form,"shipmentId");let error;
  try{const ctx=await requireMember("SHIPMENT_UPDATE");await completeDelivery(ctx,shipmentId,text(form,"pin"),text(form,"receiverName"),form.get("proof") as File,form.get("receiverId") as File);}catch(e){error=message(e);}
  revalidatePath(`/app/shipments/${shipmentId}`);redirect(destination(`/app/shipments/${shipmentId}`,error,"Delivery completed."));
}

export async function recordPaymentAction(form:FormData){
  const shipmentId=text(form,"shipmentId");let error;
  try{const ctx=await requireMember("PAYMENT_MANAGE");recordPayment(ctx,shipmentId,Number(text(form,"amount")),text(form,"method"),text(form,"reference")||undefined,text(form,"notes")||undefined);}catch(e){error=message(e);}
  revalidatePath(`/app/shipments/${shipmentId}`);redirect(destination(`/app/shipments/${shipmentId}`,error,"Payment recorded."));
}

export async function createLocationAction(form:FormData){let error;
  try{const ctx=await requireMember("NETWORK_MANAGE");createLocation(ctx,{name:text(form,"name"),code:text(form,"code"),city:text(form,"city"),area:text(form,"area"),phone:text(form,"phone"),capabilities:form.getAll("capabilities").map(String)});}catch(e){error=message(e);}
  revalidatePath("/app/network");redirect(destination("/app/network",error,"Location created."));
}
export async function createRouteLegAction(form:FormData){let error;
  try{const ctx=await requireMember("NETWORK_MANAGE");createRouteLeg(ctx,{name:text(form,"name"),code:text(form,"code"),originLocationId:text(form,"originLocationId"),destinationLocationId:text(form,"destinationLocationId"),estimatedHours:Number(text(form,"estimatedHours")),priority:Number(text(form,"priority"))});}catch(e){error=message(e);}
  revalidatePath("/app/network");redirect(destination("/app/network",error,"Route Leg created."));
}
export async function createTeamMemberAction(form:FormData){let error;
  try{const ctx=await requireMember("TEAM_MANAGE");createTeamMember(ctx,{name:text(form,"name"),email:text(form,"email"),phone:text(form,"phone"),password:text(form,"password"),role:text(form,"role"),locationIds:form.getAll("locationIds").map(String)});}catch(e){error=message(e);}
  revalidatePath("/app/team");redirect(destination("/app/team",error,"Team member created."));
}
export async function updateBrandingAction(form:FormData){let error;
  try{const ctx=await requireMember("COMPANY_MANAGE");updateBranding(ctx,{tagline:text(form,"tagline"),story:text(form,"story"),phone:text(form,"phone"),email:text(form,"email"),primary:text(form,"primary"),secondary:text(form,"secondary"),accent:text(form,"accent"),heroStyle:text(form,"heroStyle")});}catch(e){error=message(e);}
  revalidatePath("/app/settings");redirect(destination("/app/settings",error,"Branding updated."));
}

export async function createCompanyAction(form:FormData){let error;let companyId;
  try{const admin=await requirePlatformAdmin();companyId=createCompanyByAdmin(admin.id,{name:text(form,"name"),handle:text(form,"handle"),phone:text(form,"phone"),email:text(form,"email"),ownerName:text(form,"ownerName"),ownerEmail:text(form,"ownerEmail"),ownerPhone:text(form,"ownerPhone"),temporaryPassword:text(form,"temporaryPassword")});}catch(e){error=message(e);}
  revalidatePath("/admin");redirect(destination("/admin",error,`Company ${companyId||""} created.`));
}
export async function companyStatusAction(form:FormData){let error;
  try{const admin=await requirePlatformAdmin();setCompanyStatus(admin.id,text(form,"companyId"),text(form,"status")==="SUSPENDED"?"SUSPENDED":"ACTIVE",text(form,"reason"));}catch(e){error=message(e);}
  revalidatePath("/admin");redirect(destination("/admin",error,"Company status updated."));
}

export async function changePasswordAction(form:FormData){
  let error;
  try{
    const user=await (await import("@/lib/auth")).requireUser();
    await (await import("@/lib/auth")).changePassword(user.id,text(form,"currentPassword"),text(form,"newPassword"));
  }catch(e){error=message(e);}
  if(error)redirect(destination("/account",error));
  redirect("/login?success="+encodeURIComponent("Password changed. Sign in again."));
}
