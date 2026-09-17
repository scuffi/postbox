"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Download, Inbox, Route, Upload, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isActiveSettingsPath, settingsNavSections } from "./settings-nav-utils";

const icons: Record<string, LucideIcon> = {
	"/settings/account": UserRound,
	"/settings/inbox": Inbox,
	"/settings/rules": Route,
	"/settings/import": Upload,
	"/settings/export": Download,
};

export function SettingsNav() {
	const pathname = usePathname();

	return (
		<aside className="shrink-0 border-b border-border px-3 py-3 lg:w-56 lg:border-b-0 lg:border-r lg:px-3 lg:py-8">
			<div className="flex gap-6 overflow-x-auto scrollbar-none lg:sticky lg:top-8 lg:flex-col lg:gap-6">
				{settingsNavSections.map((section) => (
					<div key={section.label} className="flex shrink-0 items-center gap-1 lg:block lg:space-y-1">
						<h2 className="hidden px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground lg:block">
							{section.label}
						</h2>
						<nav className="flex gap-1 lg:flex-col lg:gap-px">
							{section.items.map((item) => {
								const active = isActiveSettingsPath(pathname, item.href);
								const Icon = icons[item.href];
								return (
									<Link
										key={item.href}
										href={item.href}
										className={cn(
											"relative flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
											active ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
										)}
									>
										{active && (
											<motion.span
												layoutId="settings-nav-pill"
												transition={{ type: "spring", stiffness: 520, damping: 42 }}
												className="absolute inset-0 rounded-lg bg-accent ring-1 ring-inset ring-border"
											/>
										)}
										{Icon && <Icon className={cn("relative size-4", active ? "text-primary" : "text-subtle-foreground")} />}
										<span className="relative">{item.label}</span>
									</Link>
								);
							})}
						</nav>
					</div>
				))}
			</div>
		</aside>
	);
}
