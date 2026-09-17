"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WebhookDelivery } from "./types";
import {
	DELIVERY_STATUS_LABELS,
	fetchDeliveries,
	formatDuration,
	formatTimestamp,
	isRetryable,
	retryDelivery,
} from "./utils";

const STATUS_STYLES: Record<WebhookDelivery["status"], string> = {
	delivered: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
	failed: "bg-red-500/10 text-red-700 dark:text-red-400",
	exhausted: "bg-red-500/10 text-red-700 dark:text-red-400",
	retrying: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
	pending: "bg-muted text-foreground/80",
};

export function WebhookDeliveries({ webhookId }: { webhookId: string }) {
	const qc = useQueryClient();
	const deliveries = useQuery({
		queryKey: ["webhook-deliveries", webhookId],
		queryFn: () => fetchDeliveries(webhookId),
		// Retries land asynchronously from the queue, so keep the table fresh while it is open.
		refetchInterval: 15_000,
	});

	const retry = useMutation({
		mutationFn: (deliveryId: string) => retryDelivery(webhookId, deliveryId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["webhook-deliveries", webhookId] });
			qc.invalidateQueries({ queryKey: ["webhooks"] });
		},
	});

	if (deliveries.isLoading) {
		return <p className="px-5 py-4 text-sm text-muted-foreground">Loading deliveries…</p>;
	}

	if (!deliveries.data?.length) {
		return <p className="px-5 py-4 text-sm text-muted-foreground">No deliveries recorded yet.</p>;
	}

	return (
		<div className="overflow-x-auto">
			<table className="data-table min-w-[820px]">
				<thead>
					<tr>
						<th>Event</th>
						<th>Status</th>
						<th>Attempts</th>
						<th>Response</th>
						<th>Last attempt</th>
						<th>Next retry</th>
						<th />
					</tr>
				</thead>
				<tbody>
					{deliveries.data.map((delivery) => (
						<tr key={delivery.id}>
							<td>
								<span className="block font-mono text-xs text-foreground">{delivery.eventType}</span>
								<span className="block text-xs text-muted-foreground">
									{formatTimestamp(delivery.createdAt)}
								</span>
							</td>
							<td>
								<Badge className={STATUS_STYLES[delivery.status]}>
									{DELIVERY_STATUS_LABELS[delivery.status] ?? delivery.status}
								</Badge>
							</td>
							<td className="whitespace-nowrap tabular-nums">
								{/* Manual retries can push attempts past the configured max, so never show "3 / 2". */}
								{delivery.attempts} / {Math.max(delivery.maxAttempts, delivery.attempts)}
							</td>
							<td>
								<span className="block whitespace-nowrap">
									{delivery.responseStatus ?? "—"}
									{delivery.durationMs !== null && (
										// An explicit separator: "200" next to "6ms" otherwise reads as "2006ms".
										<span className="ml-1 text-xs text-muted-foreground">
											· {formatDuration(delivery.durationMs)}
										</span>
									)}
								</span>
								{delivery.error && (
									<span className="mt-1 block max-w-xs truncate text-xs text-destructive" title={delivery.error}>
										{delivery.error}
									</span>
								)}
							</td>
							<td className="whitespace-nowrap text-muted-foreground">
								{formatTimestamp(delivery.lastAttemptAt)}
							</td>
							<td className="whitespace-nowrap text-muted-foreground">
								{formatTimestamp(delivery.nextRetryAt)}
							</td>
							<td>
								{isRetryable(delivery) && (
									<Button
										variant="secondary"
										size="xs"
										disabled={retry.isPending}
										onClick={() => retry.mutate(delivery.id)}
									>
										<RotateCw className="h-3 w-3" /> Retry
									</Button>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
