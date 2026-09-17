"use client";

import { MailboxSelector } from "./mailbox-selector";

export function SidebarFooter() {
	return (
		<div className="border-t border-border/70 pt-2">
			<MailboxSelector />
		</div>
	);
}
