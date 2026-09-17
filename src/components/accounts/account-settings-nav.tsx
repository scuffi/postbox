"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
	accountSettingsNavItems,
	getAccountSettingsHref,
	isActiveAccountSettingsPath,
} from "./account-settings-nav-utils";

export function AccountSettingsNav() {
	const { id } = useParams<{ id: string }>();
	const pathname = usePathname();

	return (
		<aside className="w-full shrink-0 lg:w-48">
			<div className="sticky top-6 space-y-3">
				<h2 className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Account settings
				</h2>
				<nav className="space-y-1">
					{accountSettingsNavItems.map((item) => {
						const href = getAccountSettingsHref(id, item.segment);
						return (
							<Link
								key={item.segment || "details"}
								href={href}
								className={cn(
									"block rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
									isActiveAccountSettingsPath(pathname, href)
										? "bg-primary-soft text-primary-soft-foreground"
										: "text-muted-foreground hover:bg-card/70 hover:text-foreground",
								)}
							>
								{item.label}
							</Link>
						);
					})}
				</nav>
			</div>
		</aside>
	);
}
