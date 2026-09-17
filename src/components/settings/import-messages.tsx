"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Upload } from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ImportMessagesProps, ImportMessagesResult } from "./import-messages-types";
import { getImportSummary, importMessageFiles } from "./import-messages-utils";

export function ImportMessages({ destination, sourceLabel }: ImportMessagesProps) {
	const { selectedMailbox } = useSelectedMailbox();
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ImportMessagesResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedMailbox?.id || files.length === 0) return;

		setLoading(true);
		setError(null);
		setResult(null);
		try {
			const nextResult = await importMessageFiles(selectedMailbox.id, files, destination);
			setResult(nextResult);
			window.dispatchEvent(new Event("mailflare:messages-changed"));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Import failed");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Upload className="h-4 w-4" />
					Import mail
				</CardTitle>
				<CardDescription>
					Upload exported .eml or .mbox files from source {sourceLabel}. They will be saved to the
					matching section in the selected mailbox.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="mail-import">Mail export files</Label>
						<Input
							id="mail-import"
							type="file"
							accept=".eml,.mbox,.mbx,message/rfc822,application/mbox"
							multiple
							onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
							className="block h-10 w-full cursor-pointer rounded-lg border border-input bg-card px-1.5 py-1.5 text-[13px] text-muted-foreground shadow-[0_1px_2px_rgb(0_0_0/0.03)] transition-colors hover:border-border-strong file:mr-3 file:h-7 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:text-[13px] file:font-medium file:text-foreground dark:bg-muted/40"
						/>
						<p className="text-xs leading-5 text-muted-foreground">
							Imports up to 100 messages and 25 MB per upload. Duplicate Message-ID values are skipped.
						</p>
					</div>

					<Button type="submit" disabled={!selectedMailbox || files.length === 0 || loading}>
						{loading ? "Importing..." : "Import messages"}
					</Button>

					{result && (
						<div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
							<p className="font-medium">{getImportSummary(result)}</p>
							{(result.errors ?? []).length > 0 && (
								<ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
									{result.errors.slice(0, 5).map((item) => (
										<li key={item}>{item}</li>
									))}
								</ul>
							)}
						</div>
					)}

					{error && (
						<p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
							{error}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
