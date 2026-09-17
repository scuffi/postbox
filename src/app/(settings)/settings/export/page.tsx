"use client";

import { useState } from "react";
import { Archive, Download } from "lucide-react";
import { SettingsCard, SettingsSection } from "@/components/settings/settings-section";
import { PageHeader } from "@/components/ui/page-header";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import type { ExportState } from "./types";
import { exportMailbox } from "./utils";

export default function SettingsExportPage() {
	const { selectedMailbox } = useSelectedMailbox();
	const [exportState, setExportState] = useState<ExportState>({ error: null, loading: false });

	async function onExport() {
		if (!selectedMailbox?.id) return;
		setExportState({ error: null, loading: true });
		try {
			await exportMailbox(selectedMailbox.id, `${selectedMailbox.localPart}.mbox`);
		} catch (error) {
			setExportState({ error: error instanceof Error ? error.message : "Export failed", loading: false });
			return;
		}
		setExportState({ error: null, loading: false });
	}

	return (
		<div>
			<PageHeader title="Export" description="Take your mail with you. Standard formats, no lock-in." />
			<SettingsSection title="Export mailbox" description="Message headers and bodies from the inbox selected in the sidebar, as an .mbox file. Attachments are not included.">
				<SettingsCard>
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex min-w-0 items-center gap-3">
							<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border">
								<Archive className="size-[18px]" />
							</span>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium text-foreground">
									{selectedMailbox ? `${selectedMailbox.localPart}.mbox` : "No inbox selected"}
								</p>
								<p className="truncate text-[13px] text-muted-foreground">
									{selectedMailbox ? `${selectedMailbox.localPart}@${selectedMailbox.hostname}` : "Pick an inbox in the sidebar first."}
								</p>
							</div>
						</div>
						<Button type="button" variant="secondary" disabled={!selectedMailbox || exportState.loading} onClick={onExport}>
							<Download />
							{exportState.loading ? "Preparing…" : "Download .mbox"}
						</Button>
					</div>
					{exportState.error && (
						<p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
							{exportState.error}
						</p>
					)}
				</SettingsCard>
			</SettingsSection>
		</div>
	);
}
