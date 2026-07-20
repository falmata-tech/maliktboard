# Offline Synchronization

Offline support is limited to the actions accepted in MP-36. The server remains authoritative.

- Queue the smallest validated command: action, opaque target, actor/session context, client timestamp, schema version, and stable idempotency key.
- Never claim success before server acknowledgement; display queued/sync/failed states distinctly.
- Replay in a defined order, retain failures, and make retry safe.
- Re-authorize and revalidate state on the server at replay time.
- Reject expired sessions, incompatible state, cross-tenant targets, and obsolete payload versions clearly.
- File/evidence uploads require a live connection unless a future accepted spec changes that boundary.

Offline specs require scenarios for duplicate replay, partial sync, reordered actions, expired auth, server-state conflict, browser restart, queue corruption, and recovery without data loss.
