"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Activity, ArrowUpRight, DatabaseBackup, Globe2, Mail, Palette, Route, Users, Webhook } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useBranding } from "@/components/branding-provider";
import { PageHeader, SectionHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { authFetch } from "@/lib/auth/client";

type Section = { href: string; title: string; description: string; icon: LucideIcon };

const sections: Section[] = [
	{ href: "/mailboxes", title: "Mailboxes", description: "Create addresses, aliases and shared inboxes.", icon: Mail },
	{ href: "/domains", title: "Domains", description: "Connect domains and check their DNS health.", icon: Globe2 },
	{ href: "/routing", title: "Routing", description: "Catch-alls, forwarding and sender blocks.", icon: Route },
	{ href: "/accounts", title: "Accounts", description: "Invite people and manage their access.", icon: Users },
	{ href: "/webhooks", title: "Webhooks", description: "Stream mail events to your own systems.", icon: Webhook },
	{ href: "/activity", title: "Activity", description: "See what happened across the workspace.", icon: Activity },
	{ href: "/backups", title: "Backups", description: "Snapshot and restore your mail data.", icon: DatabaseBackup },
	{ href: "/branding", title: "Branding", description: "Set the app name, icon and favicon.", icon: Palette },
];

async function countOf(url: string, key: string): Promise<number> {
	const response = await authFetch(url);
	if (!response.ok) return 0;
	const json = (await response.json()) as Record<string, unknown>;
	const list = json[key];
	return Array.isArray(list) ? list.length : 0;
}

function StatCard({ label, value, href, icon: Icon, loading, index }: { label: string; value?: number; href: string; icon: LucideIcon; loading: boolean; index: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.05 + index * 0.05 }}
		>
			<Link
				href={href}
				className="group relative block overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel"
			>
				<div className="flex items-center justify-between">
					<span className="text-[13px] font-medium text-muted-foreground">{label}</span>
					<Icon className="size-4 text-subtle-foreground transition-colors group-hover:text-primary" />
				</div>
				<div className="mt-4 h-10">
					{loading ? (
						<Skeleton className="h-9 w-12" />
					) : (
						<span className="font-display text-[44px] leading-none tabular-nums text-foreground">{value ?? 0}</span>
					)}
				</div>
			</Link>
		</motion.div>
	);
}

export default function AdminOverviewPage() {
	const branding = useBranding();
	const stats = useQuery({
		queryKey: ["admin-overview", "counts"],
		queryFn: async () => {
			const [domains, mailboxes, accounts, webhooks] = await Promise.all([
				countOf("/api/domains", "domains"),
				countOf("/api/mailboxes", "mailboxes"),
				countOf("/api/accounts", "accounts"),
				countOf("/api/webhooks", "webhooks"),
			]);
			return { domains, mailboxes, accounts, webhooks };
		},
	});
	const visibleSections = sections.filter((section) => section.href !== "/branding" || branding.canCustomizeBranding);

	return (
		<div>
			<PageHeader
				eyebrow="Workspace"
				title="Overview"
				description={`Everything that keeps ${branding.appName} delivering: domains, addresses, people and integrations.`}
			/>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<StatCard index={0} label="Domains" value={stats.data?.domains} href="/domains" icon={Globe2} loading={stats.isLoading} />
				<StatCard index={1} label="Mailboxes" value={stats.data?.mailboxes} href="/mailboxes" icon={Mail} loading={stats.isLoading} />
				<StatCard index={2} label="Accounts" value={stats.data?.accounts} href="/accounts" icon={Users} loading={stats.isLoading} />
				<StatCard index={3} label="Webhooks" value={stats.data?.webhooks} href="/webhooks" icon={Webhook} loading={stats.isLoading} />
			</div>

			<SectionHeader title="Manage" description="Jump straight to a part of your mail infrastructure." className="mt-10" />
			<div className="grid gap-3 sm:grid-cols-2">
				{visibleSections.map((section, index) => {
					const Icon = section.icon;
					return (
						<motion.div
							key={section.href}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 + index * 0.035 }}
						>
							<Link
								href={section.href}
								className="group flex h-full items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-border-strong hover:bg-elevated hover:shadow-panel"
							>
								<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-inset ring-border transition-colors group-hover:bg-primary-soft group-hover:text-primary-soft-foreground group-hover:ring-primary/20">
									<Icon className="size-[18px]" />
								</span>
								<span className="min-w-0 flex-1">
									<span className="block text-sm font-semibold text-foreground">{section.title}</span>
									<span className="block truncate text-[13px] text-muted-foreground">{section.description}</span>
								</span>
								<ArrowUpRight className="size-4 shrink-0 text-subtle-foreground transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
							</Link>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
