<img src="/public/icon-96.png" alt="postbox" width="72" />

# postbox

**postbox** is our internal email workspace: one self-hosted inbox for every domain we own, running entirely inside our own Cloudflare account.

It is built on top of [Mailflare](https://github.com/hieunc229/mailflare) — we forked it, extended it for a multi-domain workflow, and restyled it into its own tool. Massive thanks to [@hieuSSR](https://x.com/hieuSSR) for the foundation; email plumbing is not a place anyone should start from scratch.

## Why this exists

- One place to receive mail for **every domain we own** — including subdomains like `donotreply@outbound.example.com`.
- Create **new addresses on the fly**, with Email Routing configured automatically.
- Read everything in **one unified inbox**, or drill into a single domain.
- **Self-hosted and cheap** — runs on Cloudflare's free tier for receiving mail.

## Extended on top of Mailflare

| Area | What changed |
| --- | --- |
| Multi-domain | Domain rail in the sidebar — every mailbox grouped under its domain, colour-coordinated per domain |
| Unified inbox | "All inboxes" view streams mail across every domain and mailbox in one list |
| Subdomains | `donotreply@outbound.example.com` is a first-class mailbox (Cloudflare subdomain email routing) |
| Design | Full redesign: light + dark themes, postbox-red accent, motion (springs, staggered lists), ⌘K command palette, rebuilt primitives |
| Licensing | Removed — no Pro/Team gates, no license pages; every capability is on |
| Self-update | Removed — this repo is the source of truth; deploys are push-based |

Everything else — routing rules, spam filtering, shared mailboxes, webhooks, backups, JMAP, import/export — is inherited from Mailflare.

## How it works

postbox runs in your Cloudflare account. Email Routing delivers incoming messages to the Worker, Cloudflare's email service handles outgoing messages. Mail data stays in your own D1 database; attachments and raw MIME live in your own R2 bucket.

| | Cost |
| --- | --- |
| Receiving email | **Free** |
| Sending email | Requires the Workers paid plan ($5/month) |

## Local development

The Node runtime needs no Cloudflare credentials — SQLite and local files stand in for D1 and R2:

```bash
npm install
SMTP_INBOUND_PORT=0 MAILFLARE_RUNTIME=node DATA_DIR=./data node --import tsx server/index.ts
```

Then seed demo data (three domains including a subdomain, four mailboxes):

```bash
curl -X POST http://localhost:3000/api/seed
# admin@example.com / demo-password-change-me
```

## Deployment

Deploy from this repo — either let GitHub Actions deploy on every push to `main`, or use the one-click button for the first install:

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/scuffi/postbox)

See [docs/deployment.md](docs/deployment.md) for the full guide. The short version:

1. **Provision + deploy** — add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub secrets; pushing to `main` provisions D1, R2 and Queues, applies migrations, and deploys the Worker. Keep the Worker name `mailflare` (internal plumbing depends on it).
2. **Add `CF_TOKEN`** — a scoped API token the app uses at runtime to manage your domains (`wrangler secret put CF_TOKEN`, or Settings → Variables in the dashboard). Permissions are listed in the deployment guide.
3. **Complete setup** — open the deployed URL, follow `/setup`, create the admin account.
4. **Connect email domains** — Admin → Domains → add each domain (it must be on Cloudflare DNS). MX/Email Routing is configured automatically.
5. **Custom domain for the app** — Workers → your Worker → Settings → Domains & Routes → Add custom domain.

## License

AGPL-3.0, inherited from Mailflare. See [LICENSE](LICENSE).
