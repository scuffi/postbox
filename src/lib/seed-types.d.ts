import type { domains, mailboxes } from "@/db/schema";

export type SeedMailboxKey = "support" | "billing" | "donotreply" | "hello";

export type SeedMailboxMap = Record<SeedMailboxKey, typeof mailboxes.$inferSelect>;

export type SeedDomainMap = Record<string, typeof domains.$inferSelect>;

export type SeedMessageStatus =
	| "received"
	| "sent"
	| "draft"
	| "trash"
	| "spam"
	| "queued"
	| "failed";

export type SeedMessageDefinition = {
	mailbox: SeedMailboxKey;
	direction: "inbound" | "outbound";
	status: SeedMessageStatus;
	fromAddr: string;
	toAddr: string;
	subject: string;
	textBody: string;
	read?: boolean;
	minutesAgo: number;
	providerMessageId?: string;
};