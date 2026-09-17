"use client";

import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ComposeProvider } from "@/components/compose/compose-context";
import { FloatingComposer } from "@/components/compose/floating-composer";
import { MailSearchProvider } from "@/components/mail-search/mail-search-context";
import { MailboxProvider } from "@/components/mailbox-provider";
import { DashboardNav } from "@/components/dashboard-nav";
import { MailTabBar } from "@/components/mobile-tab-bar";
import { SidebarProvider } from "@/components/sidebar-state";
import { ShortcutsProvider } from "@/components/shortcuts";

export default function SettingsGroupLayout({ children }: { children: React.ReactNode }) {
	return (
		<AuthGuard>
			<SidebarProvider>
				<MailboxProvider>
					<ComposeProvider>
						<MailSearchProvider>
							<ShortcutsProvider>
								<AppShell sidebar={<DashboardNav />} topbar={<AppTopbar />} tabBar={<MailTabBar />}>
									{children}
								</AppShell>
								<FloatingComposer />
							</ShortcutsProvider>
						</MailSearchProvider>
					</ComposeProvider>
				</MailboxProvider>
			</SidebarProvider>
		</AuthGuard>
	);
}
