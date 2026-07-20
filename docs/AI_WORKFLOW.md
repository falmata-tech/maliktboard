# AI-Assisted Development Workflow

## Control loop

```text
observe -> specify -> challenge -> accept -> test-first -> implement
        -> verify -> human acceptance -> release -> observe
```

The AI may draft, analyze, implement, and verify. It may not approve its own requirements, architecture exceptions, risk waivers, human browser acceptance, destructive migrations, or production rollout. The agent owns deterministic local browser automation and, when connected, Browserbase execution before requesting focused human usability review.

## Required agent check-ins

Before code, report the active spec IDs, risk tier, scope/non-goals, open decisions, and planned checks. During work, report discovered scope pressure instead of absorbing it. At completion, report changed behavior, evidence, remaining risks, and rollback—not merely files touched. Do not ask the product owner to repeat deterministic browser checks already covered by agent evidence.

## Anti-drift checks

- Diff every change against accepted criteria and non-goals.
- Reject “while here” features and unrelated cleanup.
- Treat existing code and generated UI as hypotheses until traced to a requirement.
- Do not manufacture tests that mirror implementation without asserting user/domain outcomes.
- Prefer deterministic tools and repository facts over memory.
- Require a failing reproduction for defects whenever practical.
- Preserve security controls and data; never use destructive resets as a routine fix.
- Stop on contradictory sources, unclear irreversible choices, or missing authority.

## Token-efficient modes

- Tier 0: one short change note; no repeated architecture context.
- Tier 1: one layer spec; read only active spec, linked base section, affected code/tests.
- Tier 2: linked affected-layer specs; load only relevant ADRs/contracts.
- Tier 3: full relevant security/data/deployment context and explicit human checkpoints.

Use IDs and links instead of duplicating prose. Keep base specs short. Put detailed scenarios in feature specs, not chat. Update the progress ledger so the next session starts with a small context packet: active IDs, decision status, evidence, and next gate.

## Review separation

For high-risk work, use distinct passes even if one person performs them: product/scenario review, architecture/security review, implementation review, verification review, and release approval. A review pass must challenge assumptions rather than merely restate the authoring pass.
