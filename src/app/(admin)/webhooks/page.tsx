"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, KeyRound, Plus, RefreshCw, Send, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { ListCard } from "@/components/ui/list-card";
import { PageHeader } from "@/components/ui/page-header";
import { SkeletonRows } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Webhook, WebhookEvent } from "./types";
import {
	WEBHOOK_EVENTS,
	createWebhook,
	deleteWebhook,
	fetchWebhooks,
	testWebhook,
	updateWebhook,
} from "./utils";
import { WebhookDeliveries } from "./deliveries";

export default function WebhooksPage() {
	const qc = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [url, setUrl] = useState("");
	const [description, setDescription] = useState("");
	const [maxAttempts, setMaxAttempts] = useState(5);
	const [events, setEvents] = useState<WebhookEvent[]>(WEBHOOK_EVENTS.map((e) => e.value));
	const [secret, setSecret] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<string | null>(null);
	const [testResult, setTestResult] = useState<Record<string, string>>({});

	const webhooks = useQuery({ queryKey: ["webhooks"], queryFn: fetchWebhooks });
	const invalidate = () => qc.invalidateQueries({ queryKey: ["webhooks"] });

	const create = useMutation({
		mutationFn: () => createWebhook({ url, description: description || undefined, events, maxAttempts }),
		onSuccess: (result) => {
			setSecret(result.secret);
			setUrl("");
			setDescription("");
			setError(null);
			setDialogOpen(false);
			invalidate();
		},
		onError: (e: Error) => setError(e.message),
	});

	const toggle = useMutation({
		mutationFn: (hook: Webhook) => updateWebhook(hook.id, { enabled: !hook.enabled }),
		onSuccess: invalidate,
	});

	const remove = useMutation({ mutationFn: deleteWebhook, onSuccess: invalidate });

	const runTest = useMutation({
		mutationFn: testWebhook,
		onSuccess: (result, id) => {
			setTestResult((prev) => ({ ...prev, [id]: result.status }));
			invalidate();
		},
		onError: (e: Error, id) => setTestResult((prev) => ({ ...prev, [id]: e.message })),
	});

	function toggleEvent(event: WebhookEvent) {
		setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
	}

	return (
		<div className="space-y-6">
			<PageHeader
				className="mb-2"
				title="Webhooks"
				description="Deliver message events to your own endpoints, with automatic retries."
				actions={
					<Button
						onClick={() => {
							setError(null);
							setDialogOpen(true);
						}}
					>
						<Plus /> Add endpoint
					</Button>
				}
			/>

			{secret && (
				<div className="animate-fade-up rounded-2xl border border-gold/30 bg-gold-soft p-5">
					<div className="flex items-start gap-3">
						<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-gold shadow-panel">
							<KeyRound className="size-4" />
						</span>
						<div className="min-w-0 flex-1 text-sm">
							<p className="font-semibold text-foreground">Signing secret · shown once</p>
							<p className="mt-1 text-muted-foreground">
								Verify the <code className="rounded bg-card px-1 font-mono text-xs">X-Email-Platform-Signature</code> header (HMAC-SHA256 of the raw body) with this secret.
							</p>
							<code className="mt-3 block break-all rounded-lg bg-card px-3 py-2 font-mono text-xs text-foreground ring-1 ring-inset ring-border">
								{secret}
							</code>
							<Button variant="secondary" size="sm" className="mt-3" onClick={() => setSecret(null)}>
								I&apos;ve saved it
							</Button>
						</div>
					</div>
				</div>
			)}

			{webhooks.isLoading ? (
				<ListCard>
					<SkeletonRows count={3} />
				</ListCard>
			) : !webhooks.data?.length ? (
				<ListCard>
					<EmptyState
						icon={WebhookIcon}
						title="No endpoints yet"
						description="Add an endpoint to start receiving message events."
					/>
				</ListCard>
			) : (
				<div className="space-y-3">
					{webhooks.data.map((hook) => (
						<section key={hook.id} className="overflow-hidden rounded-2xl border border-border bg-card">
							<div className="flex flex-wrap items-start justify-between gap-3 p-5">
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className={hook.enabled ? "size-2 shrink-0 rounded-full bg-emerald-500" : "size-2 shrink-0 rounded-full bg-subtle-foreground"} />
										<p className="truncate font-mono text-[13px] font-medium text-foreground">{hook.url}</p>
									</div>
									{hook.description && (
										<p className="mt-1 text-[13px] text-muted-foreground">{hook.description}</p>
									)}
									<div className="mt-2.5 flex flex-wrap gap-1">
										{hook.events.map((event) => (
											<Badge key={event} variant="secondary" className="font-mono">
												{event}
											</Badge>
										))}
										{!hook.enabled && <Badge variant="warning">Paused</Badge>}
									</div>
								</div>
								<div className="flex items-center gap-1.5">
									<Tooltip label={hook.enabled ? "Pause endpoint" : "Resume endpoint"}>
										<Switch checked={hook.enabled} onCheckedChange={() => toggle.mutate(hook)} />
									</Tooltip>
									<span className="mx-1 h-5 w-px bg-border" />
									<Button
										variant="secondary"
										size="sm"
										onClick={() => runTest.mutate(hook.id)}
										disabled={runTest.isPending}
									>
										<Send /> Test
									</Button>
									<Tooltip label="Delete endpoint">
										<Button
											variant="ghost"
											size="icon-sm"
											className="hover:bg-destructive/10 hover:text-destructive"
											onClick={() => remove.mutate(hook.id)}
										>
											<Trash2 />
										</Button>
									</Tooltip>
								</div>
							</div>
							<div className="grid grid-cols-2 divide-x divide-border border-y border-border bg-elevated/50 sm:grid-cols-4">
								{[
									{ label: "Deliveries", value: hook.stats.total, tone: "text-foreground" },
									{ label: "Delivered", value: hook.stats.delivered, tone: "text-emerald-600 dark:text-emerald-400" },
									{ label: "In flight", value: hook.stats.pending, tone: "text-amber-600 dark:text-amber-400" },
									{ label: "Failed", value: hook.stats.failing, tone: "text-destructive" },
								].map((stat) => (
									<div key={stat.label} className="px-5 py-3">
										<p className="text-[11px] font-medium uppercase tracking-[0.06em] text-subtle-foreground">{stat.label}</p>
										<p className={`mt-0.5 text-lg font-semibold tabular-nums ${stat.tone}`}>{stat.value}</p>
									</div>
								))}
							</div>
							<div className="flex flex-wrap items-center gap-3 px-5 py-3">
								<Button
									variant="ghost"
									size="sm"
									className="-ml-2.5"
									onClick={() => setExpanded(expanded === hook.id ? null : hook.id)}
								>
									<Activity />
									{expanded === hook.id ? "Hide deliveries" : "View deliveries"}
								</Button>
								<span className="text-xs text-subtle-foreground">Retries up to {hook.maxAttempts} attempts</span>
								{testResult[hook.id] && (
									<span className="ml-auto text-xs text-muted-foreground">
										Test delivery: <span className="font-medium text-foreground">{testResult[hook.id]}</span>
									</span>
								)}
							</div>
							{expanded === hook.id && (
								<div className="animate-fade-up border-t border-border">
									<WebhookDeliveries webhookId={hook.id} />
								</div>
							)}
						</section>
					))}
				</div>
			)}

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add endpoint</DialogTitle>
						<DialogDescription>
							Failed deliveries retry automatically with exponential backoff.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-5"
						onSubmit={(e) => {
							e.preventDefault();
							create.mutate();
						}}
					>
						<div className="space-y-2">
							<Label htmlFor="hook-url">Endpoint URL</Label>
							<Input
								id="hook-url"
								type="url"
								required
								placeholder="https://api.example.com/hooks/mail"
								className="font-mono text-[13px]"
								value={url}
								onChange={(e) => setUrl(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="hook-description">Description</Label>
							<Input
								id="hook-description"
								value={description}
								placeholder="Optional"
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Events</Label>
							<div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
								{WEBHOOK_EVENTS.map((event) => (
									<label
										key={event.value}
										className="flex cursor-pointer items-center justify-between gap-4 px-3.5 py-2.5 transition-colors hover:bg-accent/60"
									>
										<span>
											<span className="block text-[13px] font-medium text-foreground">{event.label}</span>
											<span className="block text-xs text-muted-foreground">{event.hint}</span>
										</span>
										<Checkbox
											checked={events.includes(event.value)}
											onChange={() => toggleEvent(event.value)}
										/>
									</label>
								))}
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="hook-attempts">Max attempts</Label>
							<Input
								id="hook-attempts"
								type="number"
								min={1}
								max={10}
								className="w-28"
								value={maxAttempts}
								onChange={(e) => setMaxAttempts(Number(e.target.value))}
							/>
						</div>

						{error && <p className="text-sm text-destructive">{error}</p>}

						<DialogFooter>
							<Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
								Cancel
							</Button>
							<Button type="submit" disabled={create.isPending || events.length === 0}>
								<RefreshCw className={create.isPending ? "animate-spin" : "hidden"} />
								Create endpoint
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
