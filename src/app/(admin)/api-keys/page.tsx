"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { KeyRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardGridSkeleton } from "@/components/page-skeletons";
import { authFetch } from "@/lib/auth/client";
import type { ApiKey } from "./types";
import { parseApiKeyScopes } from "./utils";

export default function ApiKeysPage() {
	const qc = useQueryClient();
	const [name, setName] = useState("");
	const [newKey, setNewKey] = useState<string | null>(null);
	const [createOpen, setCreateOpen] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["api-keys"],
		queryFn: async () => {
			const res = await authFetch("/api/api-keys");
			return (await res.json()) as { apiKeys: ApiKey[] };
		},
	});

	const create = useMutation({
		mutationFn: async () => {
			const res = await authFetch("/api/api-keys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, scopes: ["send", "read"] }),
			});
			const json = (await res.json()) as { key?: string };
			if (!res.ok) throw new Error("Failed");
			setNewKey(json.key ?? null);
			setName("");
		},
		onSuccess: () => {
			setCreateOpen(false);
			qc.invalidateQueries({ queryKey: ["api-keys"] });
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<h1 className="font-display text-[40px] leading-[1.05] text-foreground">API keys</h1>
				<Dialog open={createOpen} onOpenChange={setCreateOpen}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="h-4 w-4" />
							New API key
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Create API key</DialogTitle>
							<DialogDescription>Create a key with send and read permissions.</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Name</Label>
								<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production app" />
							</div>
							{create.isError && (
								<p className="text-sm text-destructive">{(create.error as Error).message}</p>
							)}
							<Button onClick={() => create.mutate()} disabled={!name || create.isPending}>
								{create.isPending ? "Creating..." : "Create key"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>
			{newKey && (
				<Card className="border-primary/10 bg-primary-soft">
					<CardContent>
						<p className="text-sm font-medium text-primary">Copy your key now:</p>
						<code className="block mt-2 text-xs break-all font-bold">{newKey}</code>
					</CardContent>
				</Card>
			)}
			<section className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">{(data?.apiKeys ?? []).length} total</span>
				</div>
				{isLoading && (
					<CardGridSkeleton />
				)}
				{!isLoading && (data?.apiKeys ?? []).length === 0 && (
					<p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
						No API keys yet
					</p>
				)}
				<div className="grid gap-3">
					{(data?.apiKeys ?? []).map((key) => (
						<div
							key={key.id}
							className="flex min-h-24 items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-sm shadow-neutral-100"
						>
							<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
								<KeyRound className="h-5 w-5" />
							</span>
							<span className="min-w-0 flex-1 space-y-2">
								<span className="block truncate text-sm font-semibold text-foreground">{key.name}</span>
								<span className="block truncate no-font-mono text-sm text-muted-foreground">{key.prefix}...</span>
								<span className="flex flex-wrap gap-1">
									{parseApiKeyScopes(key.scopes).map((scope) => (
										<Badge key={scope} variant="outline">
											{scope}
										</Badge>
									))}
								</span>
							</span>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
