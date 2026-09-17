"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ManagedAccount } from "../types";
import { fetchManagedAccount, saveManagedAccount } from "../utils";

export default function AccountPermissionsPage() {
	const { id } = useParams<{ id: string }>();
	const [account, setAccount] = useState<ManagedAccount | null>(null);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		void fetchManagedAccount(id)
			.then(setAccount)
			.catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load permissions"));
	}, [id]);

	async function savePermissions() {
		if (!account) return;
		setSaving(true);
		setMessage(null);
		try {
			await saveManagedAccount(account);
			setMessage("Permissions updated");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Unable to update permissions");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-display text-[40px] leading-[1.05] text-foreground">Permissions</h1>
				<p className="mt-2 text-sm text-muted-foreground">Control what this account can manage.</p>
			</div>
			<div className="overflow-hidden rounded-2xl border border-border bg-card">
				<table className="w-full text-left">
					<thead className="border-b border-border bg-muted text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						<tr>
							<th className="px-5 py-3">Permission</th>
							<th className="w-28 px-5 py-3 text-center">Allowed</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						<tr>
							<td className="px-5 py-4">
								<p className="text-sm font-semibold text-foreground">Administrator access</p>
								<p className="mt-1 text-xs text-muted-foreground">Access administration pages and manage workspace settings.</p>
							</td>
							<td className="px-5 py-4 text-center">
								<Checkbox
									aria-label="Allow administrator access"
									checked={account?.role === "admin"}
									disabled={!account}
									onChange={(event) => account && setAccount({ ...account, role: event.target.checked ? "admin" : "user" })}
								/>
							</td>
						</tr>
						<tr>
							<td className="px-5 py-4">
								<p className="text-sm font-semibold text-foreground">Manage mailboxes</p>
								<p className="mt-1 text-xs text-muted-foreground">Allow this account to add and remove its own inboxes.</p>
							</td>
							<td className="px-5 py-4 text-center">
								<Checkbox
									aria-label="Allow mailbox management"
									checked={account?.canManageMailboxes ?? false}
									disabled={!account}
									onChange={(event) => account && setAccount({ ...account, canManageMailboxes: event.target.checked })}
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<Button onClick={() => void savePermissions()} disabled={!account || saving}>
				{saving ? "Saving..." : "Save permissions"}
			</Button>
			{message && <p className="text-sm text-muted-foreground">{message}</p>}
		</div>
	);
}
