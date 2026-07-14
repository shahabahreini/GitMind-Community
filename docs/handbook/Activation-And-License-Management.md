# Activation And License Management

> Verified against GitMind `6.0.0` on July 14, 2026.

Open **GitMind Setting > Pro** or run **GitMind: Activate GitMind Pro**.

## Activate

- **License key:** enter the key from the purchase receipt.
After activation, GitMind validates the license. Each license has an activation limit shown by the licensing service; an activation uses a device instance slot.

Order-ID and email-based activation are no longer offered because they require a privileged store API key that must not be distributed inside an extension. Existing locally validated users retain legacy access while migrating to the license key from their purchase email.

## Manage

- **Validate Existing License** checks the current activation.
- **Deactivate Pro Features** contacts the licensing service and releases the current device slot.

Deactivate before moving to another device when possible. If the old device is unavailable, open a private activation/license support request. Do not publish the license key, full order ID, purchase email, or customer details.

## Troubleshooting

1. Confirm the license key exactly matches the receipt.
2. Check network access and retry validation.
3. Refresh status, then restart VS Code.
4. If activation reports no slots, deactivate an existing device or request private support.
5. If local status and server status disagree, use the settings UI's activation repair action.

Local-only cleanup removes local Pro state but may not release a server-side device slot. Use normal deactivation first.
