export type RequestState =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PRELIMINARY_QUOTE_ISSUED"
  | "CUSTOMER_ACCEPTED"
  | "COMPANY_CONFIRMED"
  | "EXPIRED"
  | "ABANDONED"
  | "REJECTED"
  | "CANCELLED";

export type ShipmentState =
  | "AWAITING_COMPANY_RECEIPT"
  | "RECEIVED_BY_COMPANY"
  | "IN_TRANSIT"
  | "AT_COMPANY_LOCATION"
  | "READY_FOR_COLLECTION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERY_ATTEMPTED"
  | "DELIVERED"
  | "ON_HOLD"
  | "DAMAGED"
  | "MISSING"
  | "RETURNING"
  | "RETURNED"
  | "CANCELLED";

export type BatchState = "DRAFT" | "OPEN" | "SEALED" | "DISPATCHED" | "ARRIVED" | "CLOSED";
export type JourneyStepState = "PENDING" | "READY" | "DEPARTED" | "ARRIVED" | "COMPLETED" | "SKIPPED" | "EXCEPTION";
export type TeamRole = "OWNER" | "ADMIN" | "SUPERVISOR" | "TEAM_MEMBER" | "VIEWER";

export type RouteLegLike = {
  id: string;
  companyId: string;
  originLocationId: string;
  destinationLocationId: string;
  estimatedHours: number;
  priority: number;
  active: boolean;
};

export type RoutePlan = {
  legs: RouteLegLike[];
  totalHours: number;
};
