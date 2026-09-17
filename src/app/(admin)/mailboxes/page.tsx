"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, Mail, Plus, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ListCard, listRowClassName } from "@/components/ui/list-card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { getContactAvatarTint } from "@/components/contacts/contact-avatar-utils";
import { domainColor } from "@/lib/domain-color";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { notifyMailboxesChanged } from "@/components/mailbox-provider-utils";
import { authFetch } from "@/lib/auth/client";
import type { CurrentAccountResponse, Domain, MailboxOwner, MailboxesResponse } from "./types";
import { getMailboxAddress, getMailboxName } from "./utils";

export default function MailboxesPage() {
	const qc = useQueryClient();
	const router = useRouter();
	const [displayName, setDisplayName] = useState("");
	const [localPart, setLocalPart] = useState("");
	const [domainId, setDomainId] = useState("");
	const [ownerUserId, setOwnerUserId] = useState("");
	const [mailboxType, setMailboxType] = useState<"personal" | "shared">("personal");
	const [createOpen, setCreateOpen] = useState(false);

	const account = useQuery({
		queryKey: ["auth", "me"],
		queryFn: async () => {
			const res = await authFetch("/api/auth/me", { redirectOnUnauthorized: false });
			return (await res.json()) as CurrentAccountResponse;
		},
	});

	useEffect(() => {
		if (!createOpen) return;
		setDisplayName((currentName) => currentName || account.data?.user?.name?.trim() || "");
		setOwnerUserId((currentId) => currentId || account.data?.user?.id || "");
	}, [account.data?.user?.id, account.data?.user?.name, createOpen]);

	const accounts = useQuery({
		queryKey: ["accounts", "mailbox-owners"],
		queryFn: async () => {
			const res = await authFetch("/api/accounts");
			if (!res.ok) return { accounts: [] as MailboxOwner[] };
			return (await res.json()) as { accounts: MailboxOwner[] };
		},
		enabled: createOpen,
	});

	const domains = useQuery({
		queryKey: ["domains"],
		queryFn: async () => {
			const res = await authFetch("/api/domains");
			return (await res.json()) as { domains: Domain[] };
		},
	});

	const mailboxes = useQuery({
		queryKey: ["mailboxes"],
		queryFn: async () => {
			const res = await authFetch("/api/mailboxes");
			return (await res.json()) as MailboxesResponse;
		},
	});

	const create = useMutation({
		mutationFn: async () => {
			const res = await authFetch("/api/mailboxes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					domainId,
					...(mailboxType === "personal" ? { ownerUserId } : {}),
					localPart,
					displayName: displayName.trim(),
					type: mailboxType,
				}),
			});
			const json = (await res.json()) as { id?: string; error?: string };
			if (!res.ok) throw new Error(json.error ?? "Failed");
			setDisplayName("");
			setLocalPart("");
			setDomainId("");
			setOwnerUserId("");
			return json.id;
		},
		onSuccess: (mailboxId) => {
			notifyMailboxesChanged();
			setCreateOpen(false);
			qc.invalidateQueries({ queryKey: ["mailboxes"] });
			if (mailboxType === "shared" && mailboxId) router.push(`/mailboxes/${mailboxId}`);
			setMailboxType("personal");
		},
	});

	const domainMap = new Map(
		(domains.data?.domains ?? []).map((d) => [d.id, d.hostname]),
	);
	const mailboxOwners = [...(accounts.data?.accounts ?? [])];
	if (account.data?.user?.id && !mailboxOwners.some((owner) => owner.id === account.data?.user?.id)) {
		mailboxOwners.unshift({
			id: account.data.user.id,
			email: account.data.user.email ?? "",
			name: account.data.user.name ?? account.data.user.email ?? "Current account",
			role: "admin",
		});
	}

	return (
		<div className="space-y-6">
			<PageHeader
				className="mb-2"
				title="Mailboxes"
				description="Every address postbox receives mail for, personal and shared."
				actions={
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							New mailbox
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create mailbox</DialogTitle>
							<DialogDescription>Add an address and provision its routing rule automatically.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							{mailboxes.data?.canCreateShared && (
								<div className="space-y-2">
									<Label htmlFor="mailbox-type">Type</Label>
									<Select
										id="mailbox-type"
										value={mailboxType}
										onChange={(event) => setMailboxType(event.target.value as "personal" | "shared")}
										containerClassName="w-full"
									>
										<option value="personal">Personal inbox</option>
										<option value="shared">Shared inbox</option>
									</Select>
								</div>
							)}
							{mailboxType === "personal" ? (
							<div className="space-y-2">
								<Label htmlFor="mailbox-owner">Account</Label>
								<Select
									id="mailbox-owner"
									value={ownerUserId}
									onChange={(event) => {
										const owner = mailboxOwners.find((item) => item.id === event.target.value);
										setOwnerUserId(event.target.value);
										if (owner) setDisplayName(owner.name);
									}}
									containerClassName="w-full"
								>
									{mailboxOwners.map((owner) => (
										<option key={owner.id} value={owner.id}>
											{owner.name} ({owner.email})
										</option>
									))}
								</Select>
							</div>
							) : (
								<p className="rounded-2xl bg-primary-soft px-4 py-3 text-sm text-primary-soft-foreground">
									After creating the shared inbox, choose which accounts can access it.
								</p>
							)}
							<div className="space-y-2">
								<Label htmlFor="mailbox-name">Name</Label>
								<Input
									id="mailbox-name"
									value={displayName}
									onChange={(event) => setDisplayName(event.target.value)}
									placeholder="Mailbox name"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="mailbox-username">Email address</Label>
								<div className="flex h-9 overflow-hidden rounded-lg border border-input bg-card shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-[3px] focus-within:ring-ring/15 dark:bg-muted/40">
									<input
										id="mailbox-username"
										value={localPart}
										onChange={(event) => setLocalPart(event.target.value)}
										placeholder="support"
										className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-subtle-foreground"
									/>
									<span className="flex items-center border-l border-border bg-muted/60 px-2 text-sm text-muted-foreground">@</span>
									<Select
										aria-label="Domain"
										containerClassName="max-w-[55%]"
										className="h-full rounded-none border-0 bg-muted/60 shadow-none hover:border-0 focus-visible:ring-0 dark:bg-muted/60"
										value={domainId}
										onChange={(event) => setDomainId(event.target.value)}
									>
										<option value="">Select domain</option>
										{(domains.data?.domains ?? []).map((domain) => (
											<option key={domain.id} value={domain.id}>
												{domain.hostname}
											</option>
										))}
									</Select>
								</div>
							</div>
							{create.isError && (
								<p className="text-sm text-destructive">{(create.error as Error).message}</p>
							)}
						</div>
						<DialogFooter>
							<Button variant="ghost" onClick={() => setCreateOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() => create.mutate()}
								disabled={(mailboxType === "personal" && !ownerUserId) || !displayName.trim() || !domainId || !localPart || create.isPending}
							>
								{create.isPending ? "Creating…" : "Create mailbox"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				}
			/>
			<section>
				{mailboxes.isLoading ? (
					<ListCard>
						<SkeletonRows count={4} />
					</ListCard>
				) : (mailboxes.data?.mailboxes ?? []).length === 0 ? (
					<ListCard>
						<EmptyState icon={Mail} title="No mailboxes yet" description="Create an address to start receiving mail." />
					</ListCard>
				) : (
					<ListCard>
						{(mailboxes.data?.mailboxes ?? []).map((mailbox) => {
							const mailboxWithHostname = {
								...mailbox,
								hostname: mailbox.hostname ?? domainMap.get(mailbox.domainId) ?? "?",
							};
							const color = domainColor(mailboxWithHostname.hostname);

							return (
								<Link key={mailbox.id} href={`/mailboxes/${mailbox.id}`} className={listRowClassName}>
									<span
										className={cn(
											"relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
											getContactAvatarTint(getMailboxAddress(mailboxWithHostname)),
										)}
									>
										{getMailboxName(mailboxWithHostname).trim().charAt(0).toUpperCase() || "?"}
										{mailbox.hasAvatar && (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={`/api/mailboxes/${mailbox.id}/avatar`}
												alt={`${getMailboxName(mailboxWithHostname)} profile`}
												className="absolute inset-0 size-full object-cover"
												onError={(event) => event.currentTarget.remove()}
											/>
										)}
									</span>
									<span className="min-w-0 flex-1">
										<span className="flex min-w-0 items-center gap-2">
											<span className="truncate text-sm font-semibold text-foreground">
												{getMailboxName(mailboxWithHostname)}
											</span>
											{mailbox.type === "shared" && (
												<span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary-soft px-1.5 py-px text-[11px] font-medium text-primary-soft-foreground ring-1 ring-inset ring-primary/20">
													<UsersRound className="size-3" />
													Shared
												</span>
											)}
										</span>
										<span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground">
											<span className={cn("size-1.5 shrink-0 rounded-full", color.dot)} />
											<span className="truncate">{getMailboxAddress(mailboxWithHostname)}</span>
										</span>
									</span>
									<ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
								</Link>
							);
						})}
					</ListCard>
				)}
			</section>
		</div>
	);
}
