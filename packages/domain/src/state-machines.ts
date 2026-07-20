import type { BatchState, RequestState, ShipmentState } from "./types";

const requestTransitions: Record<RequestState, readonly RequestState[]> = {
  SUBMITTED: ["UNDER_REVIEW", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["PRELIMINARY_QUOTE_ISSUED", "REJECTED", "CANCELLED"],
  PRELIMINARY_QUOTE_ISSUED: ["CUSTOMER_ACCEPTED", "EXPIRED", "ABANDONED", "CANCELLED"],
  CUSTOMER_ACCEPTED: ["COMPANY_CONFIRMED", "CANCELLED"],
  COMPANY_CONFIRMED: [],
  EXPIRED: ["UNDER_REVIEW"],
  ABANDONED: ["UNDER_REVIEW"],
  REJECTED: [],
  CANCELLED: [],
};

const batchTransitions: Record<BatchState, readonly BatchState[]> = {
  DRAFT: ["OPEN"],
  OPEN: ["SEALED"],
  SEALED: ["OPEN", "DISPATCHED"],
  DISPATCHED: ["ARRIVED"],
  ARRIVED: ["CLOSED"],
  CLOSED: [],
};

const shipmentTransitions: Record<ShipmentState, readonly ShipmentState[]> = {
  AWAITING_COMPANY_RECEIPT: ["RECEIVED_BY_COMPANY", "CANCELLED"],
  RECEIVED_BY_COMPANY: ["IN_TRANSIT", "AT_COMPANY_LOCATION", "ON_HOLD", "DAMAGED", "MISSING", "CANCELLED"],
  IN_TRANSIT: ["AT_COMPANY_LOCATION", "ON_HOLD", "DAMAGED", "MISSING", "RETURNING"],
  AT_COMPANY_LOCATION: ["IN_TRANSIT", "READY_FOR_COLLECTION", "OUT_FOR_DELIVERY", "ON_HOLD", "RETURNING"],
  READY_FOR_COLLECTION: ["DELIVERED", "ON_HOLD", "RETURNING"],
  OUT_FOR_DELIVERY: ["DELIVERY_ATTEMPTED", "DELIVERED", "ON_HOLD", "RETURNING"],
  DELIVERY_ATTEMPTED: ["OUT_FOR_DELIVERY", "AT_COMPANY_LOCATION", "DELIVERED", "RETURNING"],
  DELIVERED: [],
  ON_HOLD: ["RECEIVED_BY_COMPANY", "AT_COMPANY_LOCATION", "IN_TRANSIT", "RETURNING", "CANCELLED"],
  DAMAGED: ["ON_HOLD", "RETURNING", "CANCELLED"],
  MISSING: ["ON_HOLD", "RECEIVED_BY_COMPANY", "AT_COMPANY_LOCATION", "CANCELLED"],
  RETURNING: ["RETURNED"],
  RETURNED: [],
  CANCELLED: [],
};

export function assertRequestTransition(from: RequestState, to: RequestState): void {
  if (!requestTransitions[from].includes(to)) throw new Error(`Invalid request transition: ${from} → ${to}`);
}

export function assertBatchTransition(from: BatchState, to: BatchState, allowSupervisorReopen = false): void {
  if (from === "SEALED" && to === "OPEN" && allowSupervisorReopen) return;
  if (!batchTransitions[from].includes(to)) throw new Error(`Invalid batch transition: ${from} → ${to}`);
}

export function assertShipmentTransition(from: ShipmentState, to: ShipmentState): void {
  if (!shipmentTransitions[from].includes(to)) throw new Error(`Invalid shipment transition: ${from} → ${to}`);
}

export const blockedBatchShipmentStates = new Set<ShipmentState>([
  "DELIVERED",
  "CANCELLED",
  "ON_HOLD",
  "DAMAGED",
  "MISSING",
  "RETURNING",
  "RETURNED",
]);
