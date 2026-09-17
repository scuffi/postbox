import { getEmailAddress, getEmailDisplayName, normalizeEmailAddress } from "./address";
import type {
	AuthenticationResults,
	AuthMethodResult,
	SenderVerification,
	SenderWarning,
} from "./sender-verification-types";

const AUTH_RESULTS = new Set<AuthMethodResult>(["pass", "fail", "softfail", "neutral", "none", "temperror", "permerror", "policy"]);

/** Second-level labels under which registrations happen one level deeper (example.co.uk). */
const MULTI_PART_SUFFIX_LABELS = new Set(["ac", "co", "com", "edu", "gov", "ltd", "me", "net", "nhs", "org", "plc", "sch"]);

/** Latin letters that other scripts and digits commonly stand in for. */
const CONFUSABLES: Record<string, string> = {
	"0": "o", "1": "l", "3": "e", "5": "s", "i": "l", "|": "l",
	"а": "a", "с": "c", "е": "e", "һ": "h", "і": "l", "ј": "j", "ӏ": "l", "о": "o", "р": "p", "ѕ": "s", "у": "y", "х": "x",
	"α": "a", "ε": "e", "ι": "l", "ο": "o", "ρ": "p", "τ": "t", "υ": "u", "ν": "v",
};

/**
 * Reads the receiving server's verdict from the topmost Authentication-Results header.
 * Only Cloudflare's own header counts: anything lower down could have been written by
 * the sender, and a forged "pass" is exactly what this exists to catch.
 */
export function parseAuthenticationResults(values: string[] | undefined): AuthenticationResults | null {
	const header = values?.[0];
	if (!header) return null;
	const [authservId, ...segments] = header.split(";");
	if (!/(^|\.)cloudflare\.(com|net)$/i.test(authservId?.trim() ?? "")) return null;

	const results: AuthenticationResults = {
		dmarc: null,
		dmarcDomain: null,
		dmarcPolicy: null,
		dkim: null,
		dkimDomain: null,
		spf: null,
		spfDomain: null,
	};
	for (const segment of segments) {
		// Comments can hold anything, including "=" and addresses; drop them first.
		const text = segment.replace(/\([^)]*\)/g, " ").trim();
		const match = text.match(/^(dmarc|dkim|spf)\s*=\s*([a-z]+)/i);
		if (!match) continue;
		const method = match[1].toLowerCase() as "dmarc" | "dkim" | "spf";
		const result = match[2].toLowerCase() as AuthMethodResult;
		if (!AUTH_RESULTS.has(result)) continue;
		const property = (name: string) => text.match(new RegExp(`(?:^|\\s)${name}=([^\\s;]+)`, "i"))?.[1] ?? null;

		if (method === "dmarc") {
			if (results.dmarc) continue;
			results.dmarc = result;
			results.dmarcDomain = property("header\\.from")?.toLowerCase() ?? null;
			results.dmarcPolicy = property("policy\\.dmarc")?.toLowerCase() ?? null;
		} else if (method === "dkim") {
			// Keep the first signature, but let a later passing one replace a non-pass.
			if (results.dkim === "pass" || (results.dkim && result !== "pass")) continue;
			results.dkim = result;
			results.dkimDomain = property("header\\.d")?.toLowerCase() ?? null;
		} else {
			// The HELO check is noise next to the MAIL FROM check; prefer the latter.
			const mailFrom = property("smtp\\.mailfrom");
			if (results.spf && !mailFrom) continue;
			results.spf = result;
			results.spfDomain = mailFrom ? getDomain(mailFrom) : property("smtp\\.helo")?.toLowerCase() ?? null;
		}
	}
	return results.dmarc || results.dkim || results.spf ? results : null;
}

export function getDomain(address: string): string | null {
	const at = address.lastIndexOf("@");
	const domain = (at >= 0 ? address.slice(at + 1) : address).trim().replace(/\.$/, "").toLowerCase();
	return domain || null;
}

/** An approximation of the registrable domain, good enough to compare alignment. */
export function getOrganizationalDomain(domain: string): string {
	const labels = domain.toLowerCase().split(".").filter(Boolean);
	if (labels.length <= 2) return labels.join(".");
	const [secondLevel, topLevel] = labels.slice(-2);
	const depth = topLevel.length === 2 && MULTI_PART_SUFFIX_LABELS.has(secondLevel) ? 3 : 2;
	return labels.slice(-depth).join(".");
}

function aligned(domain: string | null, fromDomain: string): boolean {
	return !!domain && getOrganizationalDomain(domain) === getOrganizationalDomain(fromDomain);
}

export function evaluateSenderVerification(
	fromAddr: string,
	results: AuthenticationResults | null,
	knownDomains: KnownDomain[],
): SenderVerification {
	const fromDomain = getDomain(getEmailAddress(fromAddr));
	const warnings = fromDomain ? getSenderWarnings(fromAddr, fromDomain, knownDomains) : [];
	if (!fromDomain || !results) return { status: "unknown", fromDomain, results, warnings };

	let status: SenderVerification["status"] = "unknown";
	if (results.dmarc === "pass" && aligned(results.dmarcDomain, fromDomain)) status = "verified";
	// Only a domain that asks for failures to be quarantined or rejected is disowning the
	// message; under p=none, forwarding and mailing lists fail routinely and mean nothing.
	else if (
		results.dmarc === "fail"
		&& aligned(results.dmarcDomain, fromDomain)
		&& (results.dmarcPolicy === "quarantine" || results.dmarcPolicy === "reject")
	) status = "failed";
	// A domain without a DMARC record can still prove itself with an aligned DKIM signature.
	else if (results.dkim === "pass" && aligned(results.dkimDomain, fromDomain)) status = "verified";

	return { status, fromDomain, results, warnings };
}

export type KnownDomain = { domain: string; own: boolean };

function getSenderWarnings(fromAddr: string, fromDomain: string, knownDomains: KnownDomain[]): SenderWarning[] {
	const warnings: SenderWarning[] = [];

	const lookalike = findLookalikeDomain(fromDomain, knownDomains);
	if (lookalike) warnings.push({ kind: "lookalike_domain", domain: getOrganizationalDomain(fromDomain), similarTo: lookalike.domain, own: lookalike.own });

	// `"support@bank.com" <someone@elsewhere.net>` shows a trusted address that is not the sender.
	const displayName = getEmailDisplayName(fromAddr);
	const claimed = displayName.match(/[^\s<>"'@]+@[^\s<>"'@]+\.[a-z]{2,}/i)?.[0];
	if (claimed && normalizeEmailAddress(claimed) !== normalizeEmailAddress(fromAddr)) {
		const claimedDomain = getDomain(claimed);
		if (claimedDomain && getOrganizationalDomain(claimedDomain) !== getOrganizationalDomain(fromDomain)) {
			warnings.push({ kind: "display_name_address", claimed: claimed.toLowerCase() });
		}
	}
	return warnings;
}

/**
 * A domain the user trusts that this sender's domain imitates: identical once confusable
 * characters are folded, one typo away, or the user's own name under another suffix.
 */
export function findLookalikeDomain(fromDomain: string, knownDomains: KnownDomain[]): KnownDomain | null {
	const sender = getOrganizationalDomain(fromDomain);
	const known = new Map<string, KnownDomain>();
	for (const item of knownDomains) {
		const domain = getOrganizationalDomain(item.domain);
		if (domain === sender) return null;
		if (!known.has(domain) || item.own) known.set(domain, { domain, own: item.own });
	}

	const senderSkeleton = skeleton(sender);
	const senderName = sender.split(".")[0];
	for (const item of known.values()) {
		if (skeleton(item.domain) === senderSkeleton) return item;
		if (sender.length >= 6 && item.domain.length >= 6 && editDistance(sender, item.domain) === 1) return item;
		if (item.own && senderName.length >= 4 && item.domain.split(".")[0] === senderName) return item;
	}
	return null;
}

function skeleton(domain: string): string {
	const folded = domain.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
	return [...folded]
		.map((char) => CONFUSABLES[char] ?? char)
		.join("")
		.replace(/rn/g, "m")
		.replace(/vv/g, "w");
}

/** Optimal string alignment distance: insertions, deletions, substitutions and swaps. */
function editDistance(a: string, b: string): number {
	if (Math.abs(a.length - b.length) > 1) return 2;
	const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) rows[0][j] = j;
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
			if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
				rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
			}
		}
	}
	return rows[a.length][b.length];
}
