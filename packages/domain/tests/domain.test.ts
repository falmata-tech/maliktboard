import test from "node:test";
import assert from "node:assert/strict";
import { assertBatchTransition, assertRequestTransition, assertShipmentTransition, findBestRoute, hasPermission } from "../src/index";

test("request state machine blocks activation before acceptance", () => {
  assert.throws(() => assertRequestTransition("PRELIMINARY_QUOTE_ISSUED", "COMPANY_CONFIRMED"));
  assert.doesNotThrow(() => assertRequestTransition("CUSTOMER_ACCEPTED", "COMPANY_CONFIRMED"));
});

test("batch state machine blocks arrival before dispatch", () => {
  assert.throws(() => assertBatchTransition("SEALED", "ARRIVED"));
  assert.doesNotThrow(() => assertBatchTransition("DISPATCHED", "ARRIVED"));
});

test("delivered shipment cannot move again", () => {
  assert.throws(() => assertShipmentTransition("DELIVERED", "OUT_FOR_DELIVERY"));
});

test("route planner isolates companies and returns shortest valid path", () => {
  const legs = [
    { id:"a", companyId:"c1", originLocationId:"1", destinationLocationId:"2", estimatedHours:2, priority:1, active:true },
    { id:"b", companyId:"c1", originLocationId:"2", destinationLocationId:"3", estimatedHours:2, priority:1, active:true },
    { id:"x", companyId:"c2", originLocationId:"1", destinationLocationId:"3", estimatedHours:1, priority:1, active:true },
  ];
  assert.deepEqual(findBestRoute("c1", "1", "3", legs)?.legs.map((x) => x.id), ["a","b"]);
});

test("team members cannot perform supervisor overrides", () => {
  assert.equal(hasPermission("TEAM_MEMBER", "SUPERVISOR_OVERRIDE"), false);
  assert.equal(hasPermission("SUPERVISOR", "SUPERVISOR_OVERRIDE"), true);
});
