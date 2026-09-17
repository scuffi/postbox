import type { MailboxOption } from "./mailbox-provider";

export type DomainGroup = {
	hostname: string;
	mailboxes: MailboxOption[];
};

/**
 * Group the accessible mailboxes by their domain hostname, ordered by
 * hostname so the rail reads deterministically. Mailboxes keep the order the
 * API returned (primary first).
 */
export function groupMailboxesByDomain(mailboxes: MailboxOption[]): DomainGroup[] {
	const groups = new Map<string, MailboxOption[]>();
	for (const mailbox of mailboxes) {
		const hostname = mailbox.hostname || "";
		const list = groups.get(hostname);
		if (list) list.push(mailbox);
		else groups.set(hostname, [mailbox]);
	}
	return Array.from(groups.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([hostname, items]) => ({ hostname, mailboxes: items }));
}

/** A short, stable glyph for a domain when the rail is collapsed. */
export function getDomainInitial(hostname: string): string {
	const trimmed = hostname.trim();
	if (!trimmed) return "?";
	return trimmed.charAt(0).toUpperCase();
}

/** Label shown under a domain's mailboxes. */
export function getMailboxRailLabel(mailbox: MailboxOption): string {
	return mailbox.displayName?.trim() || mailbox.localPart;
}