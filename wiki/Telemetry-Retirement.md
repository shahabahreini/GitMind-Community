# Telemetry Retirement

> Verified against GitMind `6.1.2` on September 3, 2026

GitMind no longer collects or transmits product telemetry. Current releases do not contain an analytics client, a telemetry setting, or an Application Insights connection string.

## Maintainer teardown checklist

Removing the code does not delete previously provisioned Azure resources or retained data. An Azure subscription owner should complete these steps manually:

1. In the Azure portal, locate the Application Insights resource previously used by GitMind.
2. Confirm no current GitMind release is sending data, then export any records that must be retained for legal or operational reasons.
3. Delete the Application Insights resource and any GitMind-specific workbooks, dashboards, alerts, action groups, saved queries, Log Analytics workspaces, or resource groups that are no longer shared.
4. Review the resource's retention and purge controls. Submit a purge request if organizational policy requires deletion before the normal retention window expires.
5. Revoke or delete related connection strings, service principals, deployment credentials, CI secrets, and local maintainer environment variables.
6. Check Azure Activity Log and billing after deletion to confirm that no dependent analytics resources remain.

Cloud deletion is intentionally not automated by this repository because resource ownership and sharing cannot be established safely from extension code.
