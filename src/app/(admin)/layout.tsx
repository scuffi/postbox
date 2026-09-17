"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailboxProvider } from "@/components/mailbox-provider";
import { AdminNav } from "@/components/admin-nav";
import { SidebarProvider } from "@/components/sidebar-state";
import { ShortcutsProvider } from "@/components/shortcuts";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<AuthGuard requireMailbox requireRole="admin">
			<SidebarProvider>
				<MailboxProvider>
					<ComposeProvider>
						<ShortcutsProvider>
							<AppShell sidebar={<AdminNav />}>
								<div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</div>
							</AppShell>
							<FloatingComposer />
						</ShortcutsProvider>
					</ComposeProvider>
				</MailboxProvider>
			</SidebarProvider>
		</AuthGuard>
	);
}
