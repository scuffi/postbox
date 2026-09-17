"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListCard, listRowClassName } from "@/components/ui/list-card";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { SkeletonRows } from "@/components/ui/skeleton";
import { getContactAvatarTint } from "@/components/contacts/contact-avatar-utils";
import { authFetch } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import type { Account, AccountResponse, Domain } from "./types";

export default function AccountsPage() {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [domains, setDomains] = useState<Domain[]>([]);
	const [username, setUsername] = useState("");
	const [domainId, setDomainId] = useState("");
	const [role, setRole] = useState<"admin" | "user">("user");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	async function loadAccounts() {
		const response = await authFetch("/api/accounts");
		const data = (await response.json()) as AccountResponse;
		if (!response.ok) throw new Error(data.error ?? "Unable to load accounts");
		setAccounts(data.accounts ?? []);
	}

	useEffect(() => {
		loadAccounts().then(async () => {
			const response = await authFetch("/api/domains");
			const data = (await response.json()) as { domains?: Domain[]; error?: string };
			if (!response.ok) throw new Error(data.error ?? "Unable to load domains");
			setDomains(data.domains ?? []);
			setDomainId(data.domains?.[0]?.id ?? "");
		}).catch((error) => {
			setMessage(error instanceof Error ? error.message : "Unable to load accounts");
		}).finally(() => setLoading(false));
	}, []);

	async function createAccount(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setMessage(null);
		try {
			const response = await authFetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, domainId, password, role }) });
			const data = (await response.json()) as AccountResponse;
			if (!response.ok) throw new Error(data.error ?? "Unable to create account");
			setUsername("");
			setPassword("");
			setCreateOpen(false);
			await loadAccounts();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Unable to create account");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div>
			<PageHeader
				title="Accounts"
				description="People who can sign in to this workspace, and the inboxes they own."
				actions={
					<Button onClick={() => setCreateOpen(true)}>
						<Plus />
						New account
					</Button>
				}
			/>

			{message && !createOpen && (
				<p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">{message}</p>
			)}

			{loading ? (
				<ListCard>
					<SkeletonRows count={4} />
				</ListCard>
			) : accounts.length === 0 ? (
				<ListCard>
					<EmptyState icon={Users} title="No accounts yet" description="Create an account so someone else can sign in." />
				</ListCard>
			) : (
				<ListCard>
					{accounts.map((account) => (
						<Link key={account.id} href={`/accounts/${account.id}`} className={listRowClassName}>
							<span
								className={cn(
									"relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
									getContactAvatarTint(account.email),
								)}
							>
								{account.name.charAt(0).toUpperCase()}
								{account.hasAvatar && (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={`/api/accounts/${account.id}/avatar`} alt="" className="absolute inset-0 size-full object-cover" />
								)}
							</span>
							<span className="min-w-0 flex-1">
								<span className="flex items-center gap-2">
									<span className="truncate text-sm font-semibold text-foreground">{account.name}</span>
									<span
										className={cn(
											"rounded-md px-1.5 py-px text-[11px] font-medium capitalize ring-1 ring-inset",
											account.role === "admin"
												? "bg-primary-soft text-primary-soft-foreground ring-primary/20"
												: "bg-muted text-muted-foreground ring-border",
										)}
									>
										{account.role}
									</span>
								</span>
								<span className="block truncate text-[13px] text-muted-foreground">{account.email}</span>
							</span>
							<ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
						</Link>
					))}
				</ListCard>
			)}

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New account</DialogTitle>
						<DialogDescription>They can sign in with this email address and password.</DialogDescription>
					</DialogHeader>
					<form onSubmit={createAccount} className="space-y-5">
						<div className="space-y-2">
							<Label htmlFor="account-username">Email</Label>
							<div className="flex h-9 overflow-hidden rounded-lg border border-input bg-card shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-[border-color,box-shadow] focus-within:border-ring/60 focus-within:ring-[3px] focus-within:ring-ring/15 dark:bg-muted/40">
								<input
									id="account-username"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									placeholder="username"
									className="min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-subtle-foreground"
									required
								/>
								<span className="flex items-center border-l border-border bg-muted/60 px-2 text-sm text-muted-foreground">@</span>
								<Select
									aria-label="Domain"
									value={domainId}
									onChange={(event) => setDomainId(event.target.value)}
									className="h-full rounded-none border-0 bg-muted/60 shadow-none hover:border-0 focus-visible:ring-0 dark:bg-muted/60"
									containerClassName="max-w-[55%]"
									required
								>
									<option value="">Select domain</option>
									{domains.map((domain) => (
										<option key={domain.id} value={domain.id}>
											{domain.hostname}
										</option>
									))}
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="account-password">Password</Label>
							<Input id="account-password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
							<p className="text-xs text-muted-foreground">At least 8 characters.</p>
						</div>
						<div className="space-y-2">
							<Label htmlFor="account-role">Role</Label>
							<Select id="account-role" value={role} onChange={(event) => setRole(event.target.value as "admin" | "user")} containerClassName="w-full">
								<option value="user">User</option>
								<option value="admin">Admin</option>
							</Select>
						</div>
						{message && <p className="text-sm text-destructive">{message}</p>}
						<DialogFooter>
							<Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={saving || !domainId}>
								{saving ? "Creating…" : "Create account"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
