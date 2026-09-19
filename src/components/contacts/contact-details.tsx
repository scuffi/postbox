"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ContactAvatarForm } from "./contact-avatar-form";
import { Label } from "@/components/ui/label";
import type { ContactDetailsRecord, ContactDetailsTriggerProps } from "./contact-details-types";
import {
	fetchContactDetails,
	updateContactName,
} from "./contact-details-utils";
import { unblockContactRequest } from "@/components/settings/blocked-contacts-utils";

export function ContactDetailsTrigger({
	mailboxId,
	address,
	name,
	className,
}: ContactDetailsTriggerProps) {
	const [open, setOpen] = useState(false);
	const [shownName, setShownName] = useState(name);
	const [contact, setContact] = useState<ContactDetailsRecord | null>(null);
	const [displayName, setDisplayName] = useState(name);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [unblocking, setUnblocking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setShownName(name);
	}, [name]);

	useEffect(() => {
		if (!open || !mailboxId) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchContactDetails(mailboxId, address)
			.then((nextContact) => {
				if (cancelled) return;
				setContact(nextContact);
				setDisplayName(nextContact.displayName ?? shownName);
			})
			.catch((loadError) => {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Unable to load contact");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [address, mailboxId, open, shownName]);

	async function saveContact() {
		if (!mailboxId || !displayName.trim()) return;
		setSaving(true);
		setError(null);
		try {
			const updated = await updateContactName(mailboxId, address, displayName);
			const nextName = updated.displayName ?? displayName.trim();
			setContact(updated);
			setShownName(nextName);
			setOpen(false);
			window.dispatchEvent(new CustomEvent("mailflare:contact-changed", {
				detail: { email: updated.email, displayName: nextName },
			}));
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "Unable to update contact");
		} finally {
			setSaving(false);
		}
	}

	async function unblockContact() {
		if (!mailboxId || !contact) return;
		setUnblocking(true);
		setError(null);
		try {
			await unblockContactRequest(contact.email, mailboxId);
			setContact({ ...contact, blocked: false });
		} catch (unblockError) {
			setError(unblockError instanceof Error ? unblockError.message : "Unable to unblock contact");
		} finally {
			setUnblocking(false);
		}
	}

	if (!mailboxId) return <span className={className}>{shownName}</span>;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={`${className ?? ""} rounded-sm text-left decoration-border-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30`}
			>
				{shownName}
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Contact details</DialogTitle>
						<DialogDescription>Update how this contact appears in your mailbox.</DialogDescription>
					</DialogHeader>
					<div className="space-y-5">
						<div className="flex flex-col items-start gap-4">
							<ContactAvatarForm
								mailboxId={mailboxId}
								address={address}
								name={shownName}
								hasAvatar={contact?.hasAvatar ?? false}
								onAvatarChange={(hasAvatar) => setContact((current) => current ? { ...current, hasAvatar } : current)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-display-name">Name</Label>
							<Input
								id="contact-display-name"
								value={displayName}
								onChange={(event) => setDisplayName(event.target.value)}
								disabled={loading || saving}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-email">Email</Label>
							<Input
								id="contact-email"
								value={contact?.email ?? address}
								disabled
							/>
						</div>
						<div className="grid gap-3 rounded-xl bg-muted p-3.5 text-sm ring-1 ring-inset ring-border sm:grid-cols-2">
							<div>
								<p className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">Source</p>
								<p className="mt-1 capitalize text-foreground/80">{contact?.source ?? "Email"}</p>
							</div>
							<div>
								<p className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">Last seen</p>
								<p className="mt-1 text-foreground/80">
									{contact?.lastSeenAt ? dayjs(contact.lastSeenAt).format("MMM DD, YYYY") : "Unknown"}
								</p>
							</div>
							{contact?.blocked && (
								<div className="flex items-center justify-between gap-3 sm:col-span-2">
									<p className="text-sm font-medium text-destructive">Blocked contact</p>
									<Button type="button" variant="secondary" size="sm" disabled={unblocking} onClick={() => void unblockContact()}>
										{unblocking ? "Unblocking…" : "Unblock"}
									</Button>
								</div>
							)}
						</div>
						{error && <p className="text-sm text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="ghost" onClick={() => setOpen(false)}>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={saveContact}
							disabled={loading || saving || !displayName.trim()}
						>
							{saving ? "Saving…" : "Save contact"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
