# GitMind Pro — License Migration

## Short version

**If GitMind Pro works today, it keeps working. You do not need to do anything, and you will not lose access.**

## What happened

GitMind Pro was sold through Lemon Squeezy. Our store there was suspended, and their license servers can no longer confirm purchases for us. That is a problem on the payment side — it says nothing about your purchase, which was real and which we still honor.

## What we changed

Older versions of GitMind checked your license against Lemon Squeezy's servers every 24 hours, and treated *any* failure — including being offline — as "not licensed." That was wrong, and with the store suspended it would have quietly downgraded paying customers to Free.

As of this release:

- GitMind recognizes your existing purchase automatically on first launch and records it locally.
- Your Pro access no longer depends on any payment provider being reachable. It does not expire.
- A failed or unreachable license check can never downgrade you. Only an explicit revocation can, and that requires us to actively revoke a key.

## Do I need to re-enter my license key?

No. GitMind detects your existing license by itself.

## What is coming next

We are moving to a new payment provider. When that is ready, you will be offered a **free replacement license key** — no charge, and no action needed until then. The new key restores online validation and adds self-service device management, so you can move GitMind to a new machine without contacting us.

You will see a one-time notice about this after a GitMind update. It will not nag you.

## Something is wrong

If GitMind shows **Free** but you paid for Pro, open an issue at
<https://github.com/shahabahreini/Gitmind-Pro/issues> with the email address you purchased with. We will restore your access. You will not be asked to pay again.
