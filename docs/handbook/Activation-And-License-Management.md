# Activation And License Management

> Verified against GitMind `5.0.2` on June 7, 2026.

Open **GitMind Setting > Pro** or run **GitMind: Activate GitMind Pro**.

## Activate

- **License key:** enter the key from the purchase receipt.
- **Order verification:** enter the Lemon Squeezy order ID and the purchase email when requested.

After activation, GitMind validates the purchase and refreshes Pro status. Each license has an activation limit shown by the licensing service; an activation uses a device instance slot.

## Manage

- **Validate Existing License** checks the current activation.
- **Refresh Subscription Status** refreshes displayed status.
- **Manage Subscription** opens the customer portal when available.
- **Deactivate Pro Features** contacts the licensing service and releases the current device slot.

Deactivate before moving to another device when possible. If the old device is unavailable, open a private activation/license support request. Do not publish the license key, full order ID, purchase email, or customer details.

## Troubleshooting

1. Confirm the license key or order details exactly match the receipt.
2. Check network access and retry validation.
3. Refresh status, then restart VS Code.
4. If activation reports no slots, deactivate an existing device or request private support.
5. If local status and server status disagree, use the settings UI's activation repair action.

Local-only cleanup removes local Pro state but may not release a server-side device slot. Use normal deactivation first.
