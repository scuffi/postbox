"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Inbox, LayoutDashboard, Mail, Menu, PenLine, Send, Star, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCompose } from "@/components/compose/compose-context";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { useMessageCounts } from "@/hooks/use-message-counts";
import { cn } from "@/lib/utils";
import { getFolderNavCount } from "./dashboard-nav-utils";
import { isMessageDetailPath, isTabActive } from "./mobile-tab-bar-utils";
import type { MobileTab } from "./mobile-tab-bar-types";
import { useSidebar } from "./sidebar-state";

const spring = { type: "spring", stiffness: 520, damping: 40, mass: 0.8 } as const;

/** Bottom navigation for mail and settings on phones, with compose as the centre action. */
export function MailTabBar() {
	const { selectedMailbox, isLoading } = useSelectedMailbox();
	const { counts } = useMessageCounts(selectedMailbox?.id, !isLoading);
	const { openComposer } = useCompose();

	const tabs: MobileTab[] = [
		{ href: "/inbox", label: "Inbox", icon: Inbox, count: getFolderNavCount("inbox", counts.folders) },
		{ href: "/starred", label: "Starred", icon: Star },
		{ href: "/sent", label: "Sent", icon: Send },
	];

	return (
		<TabBarFrame layoutGroup="mail">
			<TabLink tab={tabs[0]} layoutGroup="mail" />
			<TabLink tab={tabs[1]} layoutGroup="mail" />
			<div className="flex items-center justify-center">
				<motion.button
					type="button"
					onClick={openComposer}
					whileTap={{ scale: 0.9 }}
					transition={spring}
					className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-b from-[color-mix(in_oklab,var(--primary)_88%,white)] to-primary text-primary-foreground shadow-button"
					aria-label="New message"
				>
					<PenLine className="size-5" strokeWidth={2.2} />
				</motion.button>
			</div>
			<TabLink tab={tabs[2]} layoutGroup="mail" />
			<MenuTab />
		</TabBarFrame>
	);
}

/** Bottom navigation for the admin area; the menu tab opens the full admin sidebar. */
export function AdminTabBar() {
	const tabs: MobileTab[] = [
		{ href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
		{ href: "/mailboxes", label: "Mailboxes", icon: Mail },
		{ href: "/domains", label: "Domains", icon: Globe2 },
		{ href: "/accounts", label: "Accounts", icon: Users },
	];

	return (
		<TabBarFrame layoutGroup="admin">
			{tabs.map((tab) => (
				<TabLink key={tab.href} tab={tab} layoutGroup="admin" />
			))}
			<MenuTab />
		</TabBarFrame>
	);
}

function TabBarFrame({ children, layoutGroup }: { children: React.ReactNode; layoutGroup: string }) {
	const pathname = usePathname();
	const hidden = layoutGroup === "mail" && isMessageDetailPath(pathname);

	return (
		<AnimatePresence initial={false}>
			{!hidden && (
				<motion.nav
					key="tab-bar"
					aria-label="Primary"
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
					className="shrink-0 overflow-hidden border-t border-border bg-canvas/90 backdrop-blur-xl backdrop-saturate-150 lg:hidden"
				>
					<div className="grid h-[62px] grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)] box-content">{children}</div>
				</motion.nav>
			)}
		</AnimatePresence>
	);
}

function TabLink({ tab, layoutGroup }: { tab: MobileTab; layoutGroup: string }) {
	const pathname = usePathname();
	const active = isTabActive(pathname, tab.href, tab.exact);
	const Icon = tab.icon;

	return (
		<Link
			href={tab.href}
			aria-current={active ? "page" : undefined}
			className="group relative flex flex-col items-center justify-center gap-1 outline-none"
		>
			<motion.span whileTap={{ scale: 0.88 }} transition={spring} className="relative flex h-8 w-14 items-center justify-center">
				{active && (
					<motion.span
						layoutId={`tab-pill-${layoutGroup}`}
						transition={spring}
						className="absolute inset-0 rounded-full bg-primary-soft"
					/>
				)}
				<Icon
					className={cn("relative size-[21px] transition-colors", active ? "text-primary" : "text-muted-foreground")}
					strokeWidth={active ? 2.2 : 1.8}
				/>
				<TabBadge count={tab.count} />
			</motion.span>
			<span className={cn("text-[10.5px] font-medium leading-none tracking-[-0.005em] transition-colors", active ? "text-foreground" : "text-muted-foreground")}>
				{tab.label}
			</span>
		</Link>
	);
}

function MenuTab() {
	const { mobileOpen, setMobileOpen } = useSidebar();

	return (
		<button
			type="button"
			onClick={() => setMobileOpen(true)}
			aria-expanded={mobileOpen}
			className="relative flex flex-col items-center justify-center gap-1 outline-none"
			aria-label="Open menu"
		>
			<motion.span whileTap={{ scale: 0.88 }} transition={spring} className="relative flex h-8 w-14 items-center justify-center">
				<Menu className={cn("size-[21px] transition-colors", mobileOpen ? "text-primary" : "text-muted-foreground")} strokeWidth={1.8} />
			</motion.span>
			<span className="text-[10.5px] font-medium leading-none text-muted-foreground">Menu</span>
		</button>
	);
}

function TabBadge({ count }: { count?: number }) {
	if (typeof count !== "number" || count <= 0) return null;
	return (
		<motion.span
			key={count > 99 ? "99+" : count}
			initial={{ scale: 0.6, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ type: "spring", stiffness: 600, damping: 24 }}
			className="absolute right-1.5 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold tabular-nums text-primary-foreground ring-2 ring-canvas"
		>
			{count > 99 ? "99+" : count}
		</motion.span>
	);
}
