"use client";

import Link from "next/link";
import { Command, Settings } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { MailSearchInput } from "@/components/mail-search/mail-search-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useShortcuts } from "@/components/shortcuts";

const iconButton =
	"flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

/** Bar sitting on the canvas above the content panel on mail and settings screens. */
export function AppTopbar() {
	const { openCommandPalette, shortcutsEnabled, shortcutsPreferenceLoading } = useShortcuts();

	return (
		<>
			<MailSearchInput />
			<span className="flex-1" />
			<div className="flex items-center gap-0.5">
				{shortcutsEnabled && !shortcutsPreferenceLoading && (
					<Tooltip label="Command palette" shortcut="⌘K">
						<button type="button" onClick={openCommandPalette} className={`${iconButton} md:hidden`} aria-label="Open command palette">
							<Command className="size-4" />
						</button>
					</Tooltip>
				)}
				<ThemeToggle />
				<Tooltip label="Settings">
					<Link href="/settings/account" className={iconButton} aria-label="Settings">
						<Settings className="size-4" />
					</Link>
				</Tooltip>
			</div>
		</>
	);
}
