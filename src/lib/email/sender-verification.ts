import { and, eq, inArray } from "drizzle-orm";
import type { AppDatabase } from "@/db";
import { contacts, domains } from "@/db/schema";
import { evaluateSenderVerification, getDomain, parseAuthenticationResults } from "./sender-verification-utils";
import type { KnownDomain } from "./sender-verification-utils";
import type { SenderVerification } from "./sender-verification-types";

/**
 * Whether an inbound message really came from the domain in its From header, plus
 * impersonation warnings. Worked out when the message is opened, from the stored raw
 * headers, so it covers mail received before this existed.
 */
export async function getSenderVerification(
	db: AppDatabase,
	message: { userId: string; fromAddr: string; direction: string },
	headers: Map<string, string[]> | null,
): Promise<SenderVerification | null> {
	if (message.direction !== "inbound" || !headers) return null;
	const results = parseAuthenticationResults(headers.get("authentication-results"));
	return evaluateSenderVerification(message.fromAddr, results, await listKnownDomains(db, message.userId));
}

/**
 * Domains an impersonator would imitate: the user's own, and the ones they have written
 * to. Senders who only ever wrote in are left out, so a lookalike cannot vouch for itself.
 */
async function listKnownDomains(db: AppDatabase, userId: string): Promise<KnownDomain[]> {
	const [ownDomains, correspondents] = await Promise.all([
		db.select({ hostname: domains.hostname }).from(domains).where(eq(domains.userId, userId)),
		db
			.select({ email: contacts.email })
			.from(contacts)
			.where(and(eq(contacts.userId, userId), inArray(contacts.source, ["outbound", "manual"])))
			.limit(5000),
	]);
	const known: KnownDomain[] = ownDomains.map((row) => ({ domain: row.hostname.toLowerCase(), own: true }));
	for (const row of correspondents) {
		const domain = getDomain(row.email);
		if (domain) known.push({ domain, own: false });
	}
	return known;
}
