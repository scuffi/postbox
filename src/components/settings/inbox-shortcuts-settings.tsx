"use client";

import { useState } from "react";
import { useShortcuts } from "@/components/shortcuts";
import { Switch } from "@/components/ui/switch";

export function InboxShortcutsSettings() {
	const {
		shortcutsEnabled,
		shortcutsPreferenceLoading,
		shortcutsPreferenceError,
		setShortcutsEnabled,
	} = useShortcuts();
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	return (
		<div>
			<label className="flex cursor-pointer items-start gap-4">
				<span className="flex-1">
					<span className="block text-sm font-medium text-foreground">Keyboard shortcuts</span>
					<span className="mt-0.5 block text-[13px] leading-relaxed text-muted-foreground">
						Use quick keys to navigate, compose, and manage messages on this account.
					</span>
				</span>
				<Switch
					checked={shortcutsEnabled}
					disabled={shortcutsPreferenceLoading || saving}
					onCheckedChange={(enabled) => {
						setSaving(true);
						setSaveError(null);
						void setShortcutsEnabled(enabled)
							.catch((error) => setSaveError(error instanceof Error ? error.message : "Failed to update shortcut settings"))
							.finally(() => setSaving(false));
					}}
					aria-label="Enable keyboard shortcuts"
				/>
			</label>
			{(saveError || shortcutsPreferenceError) && (
				<p className="mt-3 text-[13px] text-destructive">{saveError || shortcutsPreferenceError}</p>
			)}
		</div>
	);
}
