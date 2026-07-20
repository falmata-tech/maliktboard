# Permissions

Authorization combines capability and scope:

```text
allowed = active actor + active company + role capability + operational scope + resource tenant
```

Platform administrators are not ordinary company members. Company roles are Owner, Administrator, Supervisor, Team Member, and Read-Only Viewer. Customers and guests receive only explicitly connected or token-authorized views.

Managers may have company-wide scope. Team Member visibility is the union of assigned locations, Route Legs, Dispatch Batches, and shipments. Viewer access never implies mutation rights. Supervisor overrides require a reason and audit record.

Every protected feature spec must contain a role/resource matrix and scenarios for allowed, denied, out-of-scope, inactive, and cross-tenant actors. UI hiding is not authorization.
