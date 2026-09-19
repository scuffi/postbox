"use client";

import { useEffect, useState } from "react";
import { Ban } from "lucide-react";
import { ContactAvatar } from "@/components/contacts/contact-avatar";
import type { ContactDetailsRecord } from "@/components/contacts/contact-details-types";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { fetchBlockedContacts, unblockContactRequest } from "./blocked-contacts-utils";

export function BlockedContactsSettings() {
	const [contacts, setContacts] = useState<ContactDetailsRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [pendingEmail, setPendingEmail] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		void fetchBlockedContacts()
			.then(setContacts)
			.catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load blocked senders"))
			.finally(() => setLoading(false));
	}, []);

	async function unblock(email: string) {
		setPendingEmail(email);
		setError(null);
		try {
			await unblockContactRequest(email);
			setContacts((current) => current.filter((contact) => contact.email !== email));
			toast.success(`Unblocked ${email}`);
		} catch (unblockError) {
			setError(unblockError instanceof Error ? unblockError.message : "Unable to unblock sender");
		} finally {
			setPendingEmail(null);
		}
	}

	if (loading) return <p className="text-[13px] text-muted-foreground">Loading…</p>;

	return (
		<div>
			{contacts.length === 0 ? (
				<div className="flex items-center gap-3 text-[13px] text-muted-foreground">
					<Ban className="size-4 shrink-0" strokeWidth={1.75} />
					No blocked senders. Block someone from the More menu on any message they send you.
				</div>
			) : (
				<ul className="-my-2 divide-y divide-border">
					{contacts.map((contact) => (
						<li key={contact.email} className="flex items-center gap-3 py-2.5">
							<ContactAvatar mailboxId={null} address={contact.email} name={contact.displayName ?? ""} />
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-foreground">{contact.displayName || contact.email}</p>
								{contact.displayName && <p className="truncate text-[13px] text-muted-foreground">{contact.email}</p>}
							</div>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={pendingEmail !== null}
								onClick={() => void unblock(contact.email)}
							>
								{pendingEmail === contact.email ? "Unblocking…" : "Unblock"}
							</Button>
						</li>
					))}
				</ul>
			)}
			{error && <p className="mt-3 text-[13px] text-destructive">{error}</p>}
		</div>
	);
}
