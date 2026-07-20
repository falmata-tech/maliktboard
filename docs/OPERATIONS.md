# Operational Runbook

## Daily

- Check `/api/health`.
- Review failed email notifications and shipment exceptions.
- Confirm the latest backup completed.
- Verify batches marked Arrived are sorted before closure.

## Weekly

- Test a tracking link and Android scan.
- Review audit logs for supervisor overrides, company suspension, payment edits, and evidence access.
- Remove inactive team accounts.
- Check disk usage for uploads and database backups.

## Incident response

1. Suspend the affected company from Platform Administration when tenant credentials are compromised.
2. Rotate application secrets only with a planned session and token migration; changing `PIN_ENCRYPTION_KEY` without migration makes encrypted tokens unreadable.
3. Preserve database, WAL, logs, and evidence before investigation.
4. Restore from the last tested backup if integrity is compromised.
5. Inform affected customers and companies as required by law and contract.
