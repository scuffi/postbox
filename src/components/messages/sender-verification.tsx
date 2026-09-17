"use client";

import { BadgeCheck, ShieldAlert, TriangleAlert } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SenderVerificationProps } from "./sender-verification-types";
import { describeAuthResult, getSenderAlerts } from "./sender-verification-utils";

/**
 * A tick beside the sender when their domain vouched for the message, or a warning
 * mark when it disowned it. Unknown stays silent: most mail is, and noise teaches
 * people to ignore the signal.
 */
export function SenderVerificationBadge({ verification, className }: SenderVerificationProps) {
	if (!verification || verification.status === "unknown") return null;
	const verified = verification.status === "verified";
	const Icon = verified ? BadgeCheck : ShieldAlert;
	const results = verification.results;
	const rows = [
		{ name: "DMARC", result: results?.dmarc ?? null, domain: results?.dmarcDomain },
		{ name: "DKIM", result: results?.dkim ?? null, domain: results?.dkimDomain },
		{ name: "SPF", result: results?.spf ?? null, domain: results?.spfDomain },
	];

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					aria-label={verified ? "Verified sender" : "Unverified sender"}
					className={cn(
						"inline-flex size-5 shrink-0 items-center justify-center rounded-full transition-colors",
						verified
							? "text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
							: "text-destructive hover:bg-destructive/10 dark:text-red-400",
						className,
					)}
				>
					<Icon className="size-4" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-0">
				<div className="flex items-start gap-3 border-b border-border px-4 py-3">
					<Icon className={cn("mt-0.5 size-5 shrink-0", verified ? "text-emerald-600 dark:text-emerald-400" : "text-destructive dark:text-red-400")} />
					<div>
						<p className="text-[13px] font-semibold text-foreground">
							{verified ? "Verified sender" : "Sender not verified"}
						</p>
						<p className="text-xs text-muted-foreground">
							{verified
								? `${verification.fromDomain} confirmed it sent this message.`
								: `${verification.fromDomain} says it did not send this message.`}
						</p>
					</div>
				</div>
				<dl className="space-y-1.5 px-4 py-3">
					{rows.map((row) => {
						const described = describeAuthResult(row.result);
						return (
							<div key={row.name} className="flex items-center gap-2.5 text-[13px]">
								<dt className="w-12 shrink-0 font-mono text-[11.5px] text-subtle-foreground">{row.name}</dt>
								<dd
									className={cn(
										"rounded px-1.5 text-[11.5px] font-medium",
										described.tone === "pass" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
										described.tone === "fail" && "bg-red-500/10 text-destructive dark:text-red-400",
										described.tone === "neutral" && "bg-muted text-muted-foreground",
									)}
								>
									{described.label}
								</dd>
								{row.domain && <dd className="min-w-0 truncate text-muted-foreground">{row.domain}</dd>}
							</div>
						);
					})}
				</dl>
			</PopoverContent>
		</Popover>
	);
}

/** Impersonation and failed-verification warnings, shown above the message body. */
export function SenderAlerts({ verification, className }: SenderVerificationProps) {
	const alerts = getSenderAlerts(verification);
	if (alerts.length === 0) return null;

	return (
		<div role="alert" className={cn("space-y-2", className)}>
			{alerts.map((alert) => {
				const Icon = alert.tone === "danger" ? ShieldAlert : TriangleAlert;
				return (
					<div
						key={alert.title}
						className={cn(
							"flex items-start gap-3 rounded-xl px-3.5 py-3 ring-1 ring-inset",
							alert.tone === "danger"
								? "bg-red-500/[0.07] ring-red-500/25"
								: "bg-amber-500/[0.08] ring-amber-500/25",
						)}
					>
						<Icon
							className={cn(
								"mt-0.5 size-4 shrink-0",
								alert.tone === "danger" ? "text-destructive dark:text-red-400" : "text-amber-600 dark:text-amber-400",
							)}
						/>
						<div className="min-w-0 text-[13px]">
							<p className="font-semibold text-foreground">{alert.title}</p>
							<p className="mt-0.5 text-foreground/75">{alert.description}</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
