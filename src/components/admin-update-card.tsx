"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApplicationUpdateStatus, triggerApplicationUpdate } from "./admin-update-card-utils";
import type { UpdateStatusResponse, UpdateWorkflowResponse } from "./admin-update-card-types";

export function AdminUpdateCard() {
	const [status, setStatus] = useState<UpdateStatusResponse>();
	const [result, setResult] = useState<UpdateWorkflowResponse>();
	const [error, setError] = useState("");
	const [isChecking, setIsChecking] = useState(true);
	const [isPending, setIsPending] = useState(false);

	useEffect(() => {
		let isActive = true;

		getApplicationUpdateStatus()
			.then((updateStatus) => {
				if (isActive) setStatus(updateStatus);
			})
			.catch((statusError) => {
				if (isActive) {
					setError(statusError instanceof Error ? statusError.message : "Could not check for updates");
				}
			})
			.finally(() => {
				if (isActive) setIsChecking(false);
			});

		return () => {
			isActive = false;
		};
	}, []);

	async function handleUpdate() {
		setError("");
		setResult(undefined);
		setIsPending(true);

		try {
			setResult(await triggerApplicationUpdate());
		} catch (updateError) {
			setError(updateError instanceof Error ? updateError.message : "Could not start the update");
		} finally {
			setIsPending(false);
		}
	}

	return (
		<Card>
			<CardHeader className="flex-row items-center gap-4">
				<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
					<RefreshCw className="h-5 w-5" />
				</div>
				<div>
					<CardTitle className="text-base">Application update</CardTitle>
					<p className="mt-1 text-sm text-muted-foreground">
						Sync the latest postbox release, apply D1 migrations, and deploy the Worker.
					</p>
				</div>
			</CardHeader>
			<CardContent className="flex items-center gap-4">
				<Button type="button" onClick={handleUpdate} disabled={isChecking || isPending || !status?.available}>
					<RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
					{isPending ? "Starting update..." : "Update postbox"}
				</Button>
				{isChecking && <Skeleton className="h-4 w-44" />}
				{!isChecking && status?.available && (
					<p className="text-sm text-amber-700 dark:text-amber-400">
						Update available: v{status.currentVersion} → v{status.targetVersion}
					</p>
				)}
				{!isChecking && status && !status.available && (
					<p className="text-sm text-emerald-700 dark:text-emerald-400">postbox v{status.currentVersion} is up to date.</p>
				)}
				{result?.ok && (
					<p className="text-sm text-emerald-700 dark:text-emerald-400">
						Update started for {result.repository}@{result.ref}.{" "}
						{result.runUrl && (
							<a className="font-medium underline" href={result.runUrl} target="_blank" rel="noreferrer">
								View workflow
							</a>
						)}
					</p>
				)}
				{error && <p className="text-sm text-destructive">{error}</p>}
			</CardContent>
		</Card>
	);
}
