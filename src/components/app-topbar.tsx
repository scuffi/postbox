"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { MailSearchInput } from "@/components/mail-search/mail-search-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { MailboxSelector } from "@/components/mailbox-selector";

const iconButton =
	"flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

/**
 * Bar sitting on the canvas above the content panel on mail and settings screens.
 * On phones it is just search and the account avatar; theme and settings live in that menu.
 */
export function AppTopbar() {
	return (
		<>
			<MailSearchInput />
			<span className="hidden flex-1 lg:block" />
			<div className="flex items-center gap-0.5">
				<ThemeToggle className="max-lg:hidden" />
				<Tooltip label="Settings">
					<Link href="/settings/account" className={`${iconButton} max-lg:hidden`} aria-label="Settings">
						<Settings className="size-4" />
					</Link>
				</Tooltip>
				<MailboxSelector variant="avatar" className="ml-1 lg:hidden" />
			</div>
		</>
	);
}
