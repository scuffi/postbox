import { authFetch } from "@/lib/auth/client";
import type { ContactDetailsRecord } from "@/components/contacts/contact-details-types";
import type { BlockedContactsResponse } from "./blocked-contacts-types";

export async function fetchBlockedContacts(): Promise<ContactDetailsRecord[]> {
	const response = await authFetch("/api/contacts/blocked");
	const data = (await response.json()) as BlockedContactsResponse;
	if (!response.ok) throw new Error(data.error ?? "Unable to load blocked senders");
	return data.contacts ?? [];
}

export async function unblockContactRequest(address: string, mailboxId?: string | null): Promise<void> {
	const response = await authFetch("/api/contacts/block", {
		method: "DELETE",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ address, mailboxId: mailboxId ?? undefined }),
	});
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "Unable to unblock sender");
}
