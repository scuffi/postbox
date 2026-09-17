import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
	appSettings,
	domains,
	mailboxes,
	messages,
	outboundJobs,
	users,
} from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { upsertContactFromAddress } from "@/lib/contacts/service";
import { buildSnippet } from "@/lib/email/parse";
import { newId } from "@/lib/ids";
import type {
	SeedDomainMap,
	SeedMailboxKey,
	SeedMailboxMap,
	SeedMessageDefinition,
} from "@/lib/seed-types";

export const demoCredentials = {
	email: "admin@example.com",
	password: "demo-password-change-me",
};

const demoDomain = "example.com";

/**
 * Seed domains exercise three shapes the UI groups in a Discord-style rail:
 * an apex domain, a subdomain (which Cloudflare routes on the parent zone),
 * and a second independent apex domain.
 */
const seedDomainDefinitions: { hostname: string; zoneId: string }[] = [
	{ hostname: demoDomain, zoneId: "00000000000000000000000000000000" },
	{ hostname: "outbound.example.com", zoneId: "00000000000000000000000000000000" },
	{ hostname: "acme.dev", zoneId: "11111111111111111111111111111111" },
];

const seedMailboxDefinitions: {
	key: SeedMailboxKey;
	hostname: string;
	localPart: string;
	displayName: string;
}[] = [
	{ key: "support", hostname: "example.com", localPart: "support", displayName: "Support" },
	{ key: "billing", hostname: "example.com", localPart: "billing", displayName: "Billing" },
	{ key: "donotreply", hostname: "outbound.example.com", localPart: "donotreply", displayName: "No Reply" },
	{ key: "hello", hostname: "acme.dev", localPart: "hello", displayName: "Acme Team" },
];

const seedMessages: SeedMessageDefinition[] = [
	{
		mailbox: "support",
		direction: "inbound",
		status: "received",
		fromAddr: `"Maya Chen" <maya@acme.test>`,
		toAddr: `"Support" <support@${demoDomain}>`,
		subject: "Cannot access workspace",
		textBody:
			"I reset my password this morning, but the login page still loops back to the sign-in screen. Can you check whether the account is locked?",
		read: false,
		minutesAgo: 12,
		providerMessageId: "<seed-inbox-access@example.test>",
	},
	{
		mailbox: "support",
		direction: "inbound",
		status: "received",
		fromAddr: `"Northwind DevOps" <devops@northwind.test>`,
		toAddr: `"Support" <support@${demoDomain}>`,
		subject: "Webhook retry question",
		textBody:
			"We noticed three delivery attempts for the same event. Is there a way to confirm whether retries stop after a 2xx response?",
		read: true,
		minutesAgo: 47,
		providerMessageId: "<seed-inbox-webhook@example.test>",
	},
	{
		mailbox: "billing",
		direction: "inbound",
		status: "received",
		fromAddr: `"Contoso Finance" <finance@contoso.test>`,
		toAddr: `"Billing" <billing@${demoDomain}>`,
		subject: "Invoice address update",
		textBody:
			"Please update our invoice contact to finance-team@contoso.test before the next billing cycle closes.",
		read: false,
		minutesAgo: 94,
		providerMessageId: "<seed-inbox-invoice@example.test>",
	},
	{
		mailbox: "donotreply",
		direction: "inbound",
		status: "received",
		fromAddr: `"Mailer Daemon" <postmaster@example.test>`,
		toAddr: `"No Reply" <donotreply@outbound.example.com>`,
		subject: "Undelivered: scheduled report bounced",
		textBody:
			"The recipient server rejected the scheduled report because the address does not exist. This address is not monitored, but the bounce landed here for tracking.",
		read: false,
		minutesAgo: 30,
		providerMessageId: "<seed-inbox-donotreply@example.test>",
	},
	{
		mailbox: "hello",
		direction: "inbound",
		status: "received",
		fromAddr: `"Globex Sales" <sales@globex.test>`,
		toAddr: `"Acme Team" <hello@acme.dev>`,
		subject: "Partnership intro",
		textBody:
			"Hi team, we would love to explore a partnership for the upcoming quarter. Can we schedule a call?",
		read: false,
		minutesAgo: 65,
		providerMessageId: "<seed-inbox-hello@example.test>",
	},
	{
		mailbox: "support",
		direction: "outbound",
		status: "sent",
		fromAddr: `"Support" <support@${demoDomain}>`,
		toAddr: `"Maya Chen" <maya@acme.test>`,
		subject: "Re: Cannot access workspace",
		textBody:
			"I cleared the stale session and sent a fresh password reset link. Please try again from an incognito window.",
		read: true,
		minutesAgo: 8,
		providerMessageId: "<seed-sent-access@example.test>",
	},
	{
		mailbox: "billing",
		direction: "outbound",
		status: "sent",
		fromAddr: `"Billing" <billing@${demoDomain}>`,
		toAddr: `"Contoso Finance" <finance@contoso.test>`,
		subject: "Re: Invoice address update",
		textBody:
			"The billing contact is updated. Future invoices will go to finance-team@contoso.test.",
		read: true,
		minutesAgo: 35,
		providerMessageId: "<seed-sent-invoice@example.test>",
	},
	{
		mailbox: "donotreply",
		direction: "outbound",
		status: "sent",
		fromAddr: `"No Reply" <donotreply@outbound.example.com>`,
		toAddr: `"Subscriber List" <digest@lists.test>`,
		subject: "Weekly digest",
		textBody:
			"Your weekly digest is attached. This is an automated message from a sending-only subdomain address.",
		read: true,
		minutesAgo: 55,
		providerMessageId: "<seed-sent-donotreply@example.test>",
	},
	{
		mailbox: "hello",
		direction: "outbound",
		status: "sent",
		fromAddr: `"Acme Team" <hello@acme.dev>`,
		toAddr: `"Globex Sales" <sales@globex.test>`,
		subject: "Re: Partnership intro",
		textBody:
			"Great to hear from you. Thursday afternoon works for a call — I will send an invite.",
		read: true,
		minutesAgo: 41,
		providerMessageId: "<seed-sent-hello@example.test>",
	},
	{
		mailbox: "support",
		direction: "outbound",
		status: "draft",
		fromAddr: `"Support" <support@${demoDomain}>`,
		toAddr: `"Northwind DevOps" <devops@northwind.test>`,
		subject: "Re: Webhook retry question",
		textBody:
			"Draft note: include retry backoff details, delivery log location, and the recommendation to return HTTP 204 after processing.",
		read: true,
		minutesAgo: 22,
	},
	{
		mailbox: "billing",
		direction: "outbound",
		status: "draft",
		fromAddr: `"Billing" <billing@${demoDomain}>`,
		toAddr: `"Globex Procurement" <procurement@globex.test>`,
		subject: "Annual plan renewal",
		textBody:
			"Draft renewal response with seat count, purchase order reference, and requested renewal date.",
		read: true,
		minutesAgo: 128,
	},
	{
		mailbox: "support",
		direction: "inbound",
		status: "spam",
		fromAddr: `"Traffic Promotions" <promo@unknown-sender.test>`,
		toAddr: `"Support" <support@${demoDomain}>`,
		subject: "Urgent traffic boost offer",
		textBody:
			"We can send thousands of visitors to your dashboard today. Reply now for the limited campaign rate.",
		read: false,
		minutesAgo: 166,
		providerMessageId: "<seed-spam-promo@example.test>",
	},
	{
		mailbox: "billing",
		direction: "inbound",
		status: "spam",
		fromAddr: `"Fake Bank Alerts" <alerts@fake-bank.test>`,
		toAddr: `"Billing" <billing@${demoDomain}>`,
		subject: "Payment account verification required",
		textBody:
			"Your payout account requires verification. Open the attached link and confirm your banking credentials.",
		read: true,
		minutesAgo: 219,
		providerMessageId: "<seed-spam-bank@example.test>",
	},
	{
		mailbox: "support",
		direction: "inbound",
		status: "trash",
		fromAddr: `"Vendor Migration" <old-thread@vendor.test>`,
		toAddr: `"Support" <support@${demoDomain}>`,
		subject: "Legacy migration thread",
		textBody:
			"This message was moved to trash after the migration checklist was completed and archived.",
		read: true,
		minutesAgo: 266,
		providerMessageId: "<seed-trash-migration@example.test>",
	},
	{
		mailbox: "billing",
		direction: "outbound",
		status: "trash",
		fromAddr: `"Billing" <billing@${demoDomain}>`,
		toAddr: `"Initech Ops" <ops@initech.test>`,
		subject: "Old billing draft",
		textBody:
			"Discarded copy of an earlier billing reply that was replaced by the final invoice response.",
		read: true,
		minutesAgo: 314,
	},
	{
		mailbox: "support",
		direction: "outbound",
		status: "queued",
		fromAddr: `"Support" <support@${demoDomain}>`,
		toAddr: `"Customer Status" <status@customer.test>`,
		subject: "Queued delivery status",
		textBody:
			"This seeded message represents an outbound email waiting for the worker queue to process.",
		read: true,
		minutesAgo: 4,
	},
	{
		mailbox: "hello",
		direction: "outbound",
		status: "queued",
		fromAddr: `"Acme Team" <hello@acme.dev>`,
		toAddr: `"Umbrella AP" <ap@umbrella.test>`,
		subject: "Queued onboarding note",
		textBody:
			"This seeded outbound message from the second domain is queued and awaiting delivery.",
		read: true,
		minutesAgo: 17,
	},
];

export async function ensureDemoBranding(env: CloudflareEnv) {
	const db = getDb(env);
	await db
		.insert(appSettings)
		.values({ id: "default", appName: "postbox" })
		.onConflictDoUpdate({
			target: appSettings.id,
			set: { appName: "postbox", updatedAt: new Date() },
		});
}

export async function ensureDemoUser(env: CloudflareEnv) {
	const db = getDb(env);
	const [existing] = await db
		.select()
		.from(users)
		.where(eq(users.email, demoCredentials.email))
		.limit(1);
	if (existing) return existing;

	const id = newId("usr");
	await db.insert(users).values({
		id,
		email: demoCredentials.email,
		passwordHash: hashPassword(demoCredentials.password),
		name: "Demo User",
		role: "admin",
	});

	const [created] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	return created!;
}

export async function ensureDemoDomains(env: CloudflareEnv, userId: string): Promise<SeedDomainMap> {
	const db = getDb(env);
	const result: SeedDomainMap = {};

	for (const definition of seedDomainDefinitions) {
		const [existing] = await db
			.select()
			.from(domains)
			.where(eq(domains.hostname, definition.hostname))
			.limit(1);
		if (existing) {
			result[definition.hostname] = existing;
			continue;
		}

		const id = newId("dom");
		await db.insert(domains).values({
			id,
			userId,
			hostname: definition.hostname,
			zoneId: definition.zoneId,
			status: "active",
			routingEnabled: true,
			sendingRequested: true,
			sendingEnabled: true,
		});

		const [created] = await db.select().from(domains).where(eq(domains.id, id)).limit(1);
		result[definition.hostname] = created!;
	}

	return result;
}

export async function ensureDemoMailboxes(
	env: CloudflareEnv,
	userId: string,
	domainMap: SeedDomainMap,
): Promise<SeedMailboxMap> {
	const db = getDb(env);
	const entries = await Promise.all(
		seedMailboxDefinitions.map(async (definition) => {
			const domain = domainMap[definition.hostname];
			const [existing] = await db
				.select()
				.from(mailboxes)
				.where(
					and(
						eq(mailboxes.domainId, domain.id),
						eq(mailboxes.localPart, definition.localPart),
					),
				)
				.limit(1);
			if (existing) return [definition.key, existing] as const;

			const id = newId("mbx");
			await db.insert(mailboxes).values({
				id,
				userId,
				domainId: domain.id,
				localPart: definition.localPart,
				displayName: definition.displayName,
			});

			const [created] = await db
				.select()
				.from(mailboxes)
				.where(eq(mailboxes.id, id))
				.limit(1);
			return [definition.key, created!] as const;
		}),
	);

	return Object.fromEntries(entries) as SeedMailboxMap;
}

export async function insertDemoMessages(
	env: CloudflareEnv,
	userId: string,
	mailboxMap: SeedMailboxMap,
): Promise<number> {
	const db = getDb(env);
	const now = Date.now();

	for (const seedMessage of seedMessages) {
		const id = newId("msg");
		const createdAt = new Date(now - seedMessage.minutesAgo * 60 * 1000);
		const mailbox = mailboxMap[seedMessage.mailbox];

		await db.insert(messages).values({
			id,
			userId,
			mailboxId: mailbox.id,
			direction: seedMessage.direction,
			providerMessageId: seedMessage.providerMessageId ?? null,
			fromAddr: seedMessage.fromAddr,
			toAddr: seedMessage.toAddr,
			subject: seedMessage.subject,
			snippet: buildSnippet(seedMessage.textBody, null),
			textBody: seedMessage.textBody,
			htmlBody: null,
			status: seedMessage.status,
			read: seedMessage.read ?? true,
			threadId: seedMessage.providerMessageId ?? null,
			createdAt,
		});

		if (seedMessage.status === "queued" || seedMessage.status === "failed") {
			await db.insert(outboundJobs).values({
				id: newId("job"),
				userId,
				messageId: id,
				status: seedMessage.status,
				payload: JSON.stringify({
					from: seedMessage.fromAddr,
					to: seedMessage.toAddr,
					subject: seedMessage.subject,
					text: seedMessage.textBody,
				}),
				error:
					seedMessage.status === "failed"
						? "Seeded delivery failure for UI and API testing"
						: null,
				createdAt,
				updatedAt: createdAt,
			});
		}

		await upsertContactFromAddress(env, {
			userId,
			address: seedMessage.direction === "inbound" ? seedMessage.fromAddr : seedMessage.toAddr,
			source: seedMessage.direction === "inbound" ? "inbound" : "outbound",
		});
	}

	return seedMessages.length;
}