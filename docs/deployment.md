# Deployment and configuration

This guide covers Cloudflare deployment, runtime configuration, and database backups.

postbox deploys from this repository — either automatically on every push to `main` (GitHub Actions), or with the one-click Cloudflare button for the first install.

## Overview

1. **Provision and deploy** — the deploy provisions the D1 database, R2 bucket and queues, applies migrations, and deploys the Worker.
2. **Add the runtime `CF_TOKEN`** — the API token postbox uses to manage your domains.
3. **Complete setup** — open the deployed app and follow `/setup` to create the first admin account.
4. **Connect your domains** — add each domain you receive mail for; routing is configured automatically.

> The Worker name must remain `postbox`. It is internal plumbing (email routing rules and the self-reference binding point at it by name) and does not affect the product name shown in the app.

## Option A: Deploy on push (GitHub Actions)

The repository ships a deploy workflow (`.github/workflows/deploy.yml`) that runs on every push to `main`.

Add these repository secrets (Settings → Secrets and variables → Actions):

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with **Workers Scripts: Edit**, **D1: Edit**, **Workers R2 Storage: Edit** and **Queues: Edit**.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account ID (dashboard right sidebar).

Then push to `main`. The first run creates the D1 database (`postbox`), R2 bucket (`postbox-raw`), and queues (`postbox-inbound`, `postbox-outbound`); later runs reuse them. Every run builds the app, applies pending D1 migrations, and deploys the Worker.

## Option B: One-click deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/scuffi/postbox)

1. Click the button and sign in to the Cloudflare account that owns your domains.
2. Keep the app name as `postbox`.
3. Let Cloudflare finish provisioning and deploying.

If you use the button, Cloudflare's own git integration may also deploy on push — pick one deploy path and disable the other so two pipelines don't race.

## Required runtime configuration

postbox needs one runtime value:

- `CF_TOKEN` — a scoped Cloudflare API token, belonging to the same account as your domains, with:
  - **Zone (all zones you will connect):** Email Routing Rules — Edit, Zone Settings — Edit, DNS — Edit.
  - **Account:** Email Routing Addresses — Edit (required to enable Email Routing); Email Sending — Edit (only to send outbound mail).

Set it as a Worker secret (it persists across deploys thanks to `keep_vars`):

```bash
npx wrangler secret put CF_TOKEN
```

…or in the dashboard under Worker → Settings → Variables and Secrets. Paste only the token value — no `Bearer` prefix, not the token ID.

Optional Worker variables:

- `TURNSTILE_SECRET_KEY` (+ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` at build time) — bot protection on the login and first-run forms.

## Complete setup

1. Open the deployed Worker URL (`postbox.<account>.workers.dev`).
2. Go to `/setup` if you are not redirected there.
3. Create the first admin account.

The setup page initializes only a new, empty database; it never applies later migrations to an existing one.

## Connect domains and mailboxes

1. **Admin → Domains → New domain** — enter a hostname that already uses Cloudflare DNS on the same account. postbox enables Email Routing and, when selected, Email Sending automatically. Subdomains work too: add `outbound.example.com` and `donotreply@outbound.example.com` becomes a deliverable mailbox.
2. **Admin → Mailboxes → New mailbox** — pick the domain, choose the local part. The routing rule is provisioned for you.

Receiving works immediately. Sending requires the Workers paid plan.

## Custom domain for the app

Workers & Pages → your `postbox` Worker → **Settings → Domains & Routes → Add custom domain**. The domain must be on Cloudflare DNS. This is the address you browse the app at and is independent of the email domains managed inside it.

## Manual deploy

```bash
npm install
npm run deploy        # opennextjs-cloudflare build + remote D1 migrations + wrangler deploy
```

If you only need to migrate an existing remote database:

```bash
npm run db:migrate:remote
```

## Database backups

postbox exports its D1 records as JSON and stores the backup files in the R2 bucket. A cron trigger runs daily at 02:00 UTC and applies the schedule selected under **Admin → Backups**. Manual backups run the same export from the admin API. Redeploy whenever the cron trigger changes.
