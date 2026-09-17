"use client";

import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SpamScoreDetailsProps } from "./spam-score-details-types";
import { parseSpamSignals } from "./spam-score-details-utils";

export function SpamScoreDetails({ score, verdict, signals, analysisError }: SpamScoreDetailsProps) {
	if (score == null && !analysisError) return null;
	const parsedSignals = parseSpamSignals(signals);
	const tone = score == null ? "unknown" : verdict === "spam" ? "spam" : verdict === "suspicious" ? "suspicious" : "clean";
	const Icon = tone === "clean" ? ShieldCheck : tone === "unknown" ? ShieldQuestion : ShieldAlert;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset transition-colors",
						tone === "clean" && "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 hover:bg-emerald-500/15 dark:text-emerald-400",
						tone === "suspicious" && "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/25 hover:bg-amber-500/15 dark:text-amber-400",
						tone === "spam" && "bg-red-500/10 text-red-700 dark:text-red-400 ring-red-500/25 hover:bg-red-500/15 dark:text-red-400",
						tone === "unknown" && "bg-muted text-muted-foreground ring-border hover:text-foreground",
					)}
				>
					<Icon className="size-3" />
					{score == null ? "Unscored" : `Spam ${score}`}
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80 p-0">
				<div className="border-b border-border px-4 py-3">
					<p className="text-[13px] font-semibold text-foreground">
						{score == null ? "Spam analysis unavailable" : `Score ${score} · ${verdict ?? "inbox"}`}
					</p>
					<p className="text-xs text-muted-foreground">How the spam filter judged this message.</p>
				</div>
				<div className="px-4 py-3">
					{analysisError ? (
						<p className="text-[13px] text-muted-foreground">The filter could not analyze this message. It was delivered normally.</p>
					) : parsedSignals.length > 0 ? (
						<ul className="space-y-1.5">
							{parsedSignals.map((signal) => (
								<li key={signal.id} className="flex items-start gap-2.5 text-[13px] text-foreground/85">
									<span
										className={cn(
											"mt-px w-9 shrink-0 rounded px-1 text-center font-mono text-[11px] font-medium tabular-nums",
											signal.score > 0 ? "bg-red-500/10 text-destructive dark:text-red-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
										)}
									>
										{signal.score > 0 ? "+" : ""}
										{signal.score}
									</span>
									{signal.reason}
								</li>
							))}
						</ul>
					) : (
						<p className="text-[13px] text-muted-foreground">No significant spam signals were found.</p>
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
