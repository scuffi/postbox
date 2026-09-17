"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLockup } from "@/components/brand/postbox-mark";
import { cn } from "@/lib/utils";
import { useHotkeys, useShortcuts } from "./shortcuts";
import { ExpandedSidebarScope, useSidebar } from "./sidebar-state";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { MailboxSelector } from "./mailbox-selector";
import { isMessageDetailPath } from "./mobile-tab-bar-utils";

/**
 * The postbox frame: a tinted canvas holding the sidebar, with page content in
 * a single raised panel. Below `lg` the sidebar moves into a slide-over drawer,
 * opened from the bottom tab bar when one is given (or a menu button otherwise).
 */
export function AppShell({
	sidebar,
	topbar,
	tabBar,
	children,
	mainClassName,
}: {
	sidebar: ReactNode;
	topbar?: ReactNode;
	tabBar?: ReactNode;
	children: ReactNode;
	mainClassName?: string;
}) {
	const { mobileOpen, setMobileOpen, toggle } = useSidebar();
	// On phones a message opens full screen, with its own back button and action bar.
	const reading = isMessageDetailPath(usePathname());
	const { shortcutsEnabled, shortcutsPreferenceLoading } = useShortcuts();
	const sidebarShortcuts = useMemo(
		() => [{ key: "[", label: "Toggle Sidebar", category: "Navigation" as const, action: toggle }],
		[toggle],
	);
	useHotkeys(sidebarShortcuts, { enabled: shortcutsEnabled && !shortcutsPreferenceLoading });

	return (
		<div className="flex h-dvh overflow-hidden bg-canvas">
			<aside className="hidden w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex">
				{sidebar}
			</aside>

			<DialogPrimitive.Root open={mobileOpen} onOpenChange={setMobileOpen}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="anim-overlay fixed inset-0 z-50 bg-stone-950/30 backdrop-blur-[2px] lg:hidden" />
					<DialogPrimitive.Content
						aria-describedby={undefined}
						className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,86vw)] flex-col bg-canvas pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-float outline-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-[overlay-out_0.15s_ease-in] data-[state=open]:animate-[drawer-in_0.35s_cubic-bezier(0.16,1,0.3,1)] lg:hidden"
					>
						<DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
						<ExpandedSidebarScope>{sidebar}</ExpandedSidebarScope>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>

			<div className="flex min-w-0 flex-1 flex-col pt-[env(safe-area-inset-top)] lg:py-2 lg:pr-2">
				<div className={cn("flex h-14 shrink-0 items-center gap-2 px-3 lg:h-12 lg:pl-1 lg:pr-1", !topbar && "lg:hidden", reading && "max-lg:hidden")}>
					{!tabBar && (
						<button
							type="button"
							onClick={() => setMobileOpen(true)}
							className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
							aria-label="Open navigation"
						>
							<Menu className="size-[18px]" />
						</button>
					)}
					{topbar ?? (
						<>
							<BrandLockup className="lg:hidden" />
							<span className="flex-1" />
							<MailboxSelector variant="avatar" className="lg:hidden" />
						</>
					)}
				</div>
				<main
					className={cn(
						"relative min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-border bg-card scrollbar-gutter-stable lg:rounded-2xl lg:border-t-0 lg:shadow-panel",
						mainClassName,
					)}
				>
					{children}
				</main>
				{tabBar}
			</div>
		</div>
	);
}

/** Scrollable sidebar column with a fixed header and footer. */
export function SidebarFrame({ header, footer, children }: { header: ReactNode; footer?: ReactNode; children: ReactNode }) {
	const { minimal } = useSidebar();
	return (
		<nav className="flex h-full min-h-0 flex-col">
			<div className={cn("shrink-0 pt-3", minimal ? "px-2" : "px-3")}>{header}</div>
			<div className={cn("min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-3 scrollbar-none", minimal ? "px-2" : "px-3")}>
				{children}
			</div>
			{footer && <div className={cn("shrink-0 pb-3", minimal ? "px-2" : "px-3")}>{footer}</div>}
		</nav>
	);
}

export function SidebarSection({
	label,
	action,
	children,
	className,
}: {
	label?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	className?: string;
}) {
	const { minimal } = useSidebar();
	return (
		<section className={cn("mt-5 first:mt-3", className)}>
			{label && !minimal && (
				<div className="group/section mb-1 flex h-6 items-center justify-between pl-2.5 pr-1">
					<span className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">{label}</span>
					{action}
				</div>
			)}
			{label && minimal && <div className="mx-auto mb-2 h-px w-6 bg-border" />}
			<div className="flex flex-col gap-px">{children}</div>
		</section>
	);
}
