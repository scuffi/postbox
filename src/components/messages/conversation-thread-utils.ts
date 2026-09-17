import dayjs from "dayjs";
import { getEmailAddress, getEmailDisplayName, splitEmailAddressList } from "@/lib/email/address";
import type { ThreadMessage } from "@/hooks/types";

/** The whole conversation in reading order: oldest first, or newest first when asked. */
export function orderThreadMessages(messages: ThreadMessage[], latestMessagesFirst: boolean): ThreadMessage[] {
	const ordered = [...messages].sort((a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf());
	return latestMessagesFirst ? ordered.reverse() : ordered;
}

/** Time only, for rows that already sit under a day separator. */
export function formatThreadTime(createdAt: string): string {
	return dayjs(createdAt).format("HH:mm");
}

export function formatThreadTimestampFull(createdAt: string): string {
	return dayjs(createdAt).format("dddd, D MMMM YYYY [at] HH:mm");
}

/** Separator label above the first message of each day. */
export function getThreadDayLabel(createdAt: string): string {
	const date = dayjs(createdAt);
	const now = dayjs();
	if (date.isSame(now, "day")) return "Today";
	if (date.isSame(now.subtract(1, "day"), "day")) return "Yesterday";
	if (date.isSame(now, "year")) return date.format("dddd, D MMMM");
	return date.format("D MMMM YYYY");
}

export function isSameThreadDay(a: string, b: string): boolean {
	return dayjs(a).isSame(dayjs(b), "day");
}

/** Distinct people in the conversation, in the order they first appear. */
export function getThreadParticipants(messages: ThreadMessage[], currentAccountName?: string): string[] {
	const seen = new Map<string, string>();
	for (const message of messages) {
		const email = getEmailAddress(message.fromAddr).toLowerCase();
		if (!email || seen.has(email)) continue;
		seen.set(email, getConversationSender(message, currentAccountName));
	}
	return [...seen.values()];
}

export function getConversationSender(message: ThreadMessage, currentAccountName?: string): string {
	if (message.direction === "outbound") return currentAccountName ?? getEmailDisplayName(message.fromAddr);
	return message.fromContactName ?? getEmailDisplayName(message.fromAddr);
}

export function getConversationSenderEmail(message: ThreadMessage): string {
	if (message.direction === "outbound") return getEmailAddress(message.fromAddr);
	return getEmailAddress(message.fromAddr);
}


/** "to Maya, Sam" style summary for a collapsed card. */
export function getConversationRecipients(message: ThreadMessage): string {
	const names = [...splitEmailAddressList(message.toAddr), ...splitEmailAddressList(message.ccAddr)].map(
		(entry) => getEmailDisplayName(entry),
	);
	if (names.length === 0) return "";
	if (names.length <= 3) return names.join(", ");
	return `${names.slice(0, 3).join(", ")}, +${names.length - 3}`;
}

export function getAvatarInitial(message: ThreadMessage, currentAccountName?: string): string {
	const name = getConversationSender(message, currentAccountName) || getEmailAddress(message.fromAddr);
	return name.trim().charAt(0).toUpperCase() || "?";
}
