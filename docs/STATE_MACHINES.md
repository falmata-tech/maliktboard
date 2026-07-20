# State Machines

The baseline transitions are defined in MP-16 and MP-19 through MP-24. Executable rules belong in `packages/domain/src/state-machines.ts` and application services.

Each state-changing spec must state:

- valid source and target states;
- actor and scope requirements;
- guards and required evidence;
- transactional writes and emitted events;
- idempotency behavior;
- retry/concurrency behavior;
- prohibited transitions and user-facing errors;
- compensation or supervisor override path.

No Boolean may silently duplicate state-machine meaning. A transition is complete only when state, journey, batch membership, events, notifications, usage, and audit effects remain consistent.
