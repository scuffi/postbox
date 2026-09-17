import Link from "next/link";
import type { DragEvent, MouseEvent } from "react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { getMessageDragData } from "@/lib/messages/drag-utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import { useSelectedMailbox } from "./mailbox-provider";
import { useSidebar } from "./sidebar-state";
import { useCompose } from "./compose/compose-context";
import { preloadMailboxPage, waitForNavigationProgress } from "./components-nav-utils";
import type { NavLink } from "./components-nav-types";

export function NavCount({ count, minimal = false, emphasis = false }: { count?: number; minimal?: boolean; emphasis?: boolean }) {
	if (typeof count !== "number" || count <= 0) return null;
	const label = count > 99 ? "99+" : count;
	if (minimal) {
		return (
			<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9.5px] font-semibold tabular-nums text-primary-foreground ring-2 ring-canvas">
				{label}
			</span>
		);
	}
	return (
		<motion.span
			key={label}
			initial={{ scale: 0.7, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			transition={{ type: "spring", stiffness: 600, damping: 28 }}
			className={cn(
				"relative ml-auto shrink-0 rounded-md px-1.5 text-[11.5px] font-medium tabular-nums leading-5",
				emphasis ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground",
			)}
		>
			{label}
		</motion.span>
	);
}

export function NavigationProgressBar({ progress }: { progress: number | null }) {
	return (
		<AnimatePresence>
			{progress !== null && (
				<motion.div
					className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[2px]"
					initial={{ opacity: 1 }}
					exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
				>
					<div
						className="h-full bg-primary shadow-[0_0_10px_var(--primary),0_0_4px_var(--primary)] transition-[width] duration-150 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export function NavItem({ link, layoutGroup = "sidebar" }: { link: NavLink; layoutGroup?: string }) {
	const pathname = usePathname();
	const router = useRouter();
	const { openComposer } = useCompose();
	const { selectedMailbox } = useSelectedMailbox();
	const { minimal } = useSidebar();
	const [dragOver, setDragOver] = useState(false);
	const [navigationProgress, setNavigationProgress] = useState<number | null>(null);

	useEffect(() => {
		if (navigationProgress === null) return;
		setNavigationProgress(100);
		const timer = window.setTimeout(() => setNavigationProgress(null), 220);
		return () => window.clearTimeout(timer);
	}, [pathname]);

	if (!link.href) {
		return <span className="flex-1" />;
	}

	const Icon = link.icon;
	if (!Icon) return null;
	const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
	const dropProps = link.onMessageDrop
		? {
				onDragOver: (event: DragEvent) => {
					event.preventDefault();
					event.dataTransfer.dropEffect = "move";
					setDragOver(true);
				},
				onDragLeave: () => setDragOver(false),
				onDrop: (event: DragEvent) => {
					const payload = getMessageDragData(event.dataTransfer);
					setDragOver(false);
					if (!payload) return;
					event.preventDefault();
					link.onMessageDrop?.(payload.messageIds);
				},
			}
		: {};

	if (link.href === "/compose") {
		const button = (
			<button
				type="button"
				onClick={openComposer}
				className={cn(
					"group relative flex h-9 w-full items-center gap-2 rounded-xl bg-gradient-to-b from-[color-mix(in_oklab,var(--primary)_90%,white)] to-primary text-[13.5px] font-medium text-primary-foreground shadow-button transition-[filter,transform] duration-150 hover:brightness-[1.06] active:scale-[0.98]",
					minimal ? "mx-auto size-10 justify-center rounded-xl px-0" : "px-3",
				)}
				{...dropProps}
			>
				<Icon className="size-[17px]" strokeWidth={2.1} />
				{!minimal && <span className="flex-1 text-left">{link.label}</span>}
				{!minimal && (
					<Kbd className="border-white/25 bg-white/15 text-white/85 shadow-none">C</Kbd>
				)}
			</button>
		);
		return minimal ? (
			<Tooltip label={link.label} side="right" shortcut="C">
				{button}
			</Tooltip>
		) : (
			button
		);
	}

	async function navigate(event: MouseEvent<HTMLAnchorElement>) {
		if (!link.preloadMessages || active || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		setNavigationProgress(12);
		const timer = window.setInterval(() => {
			setNavigationProgress((current) => (current === null ? 12 : Math.min(90, current + 8)));
		}, 80);
		try {
			router.prefetch(link.href!);
			await Promise.all([preloadMailboxPage(link.href!, selectedMailbox?.id), waitForNavigationProgress()]);
			setNavigationProgress(100);
			await waitForNavigationProgress(160);
			router.push(link.href!);
		} catch {
			setNavigationProgress(null);
		} finally {
			window.clearInterval(timer);
		}
	}

	const anchor = (
		<Link
			href={link.href}
			onClick={navigate}
			aria-current={active ? "page" : undefined}
			className={cn(
				"group relative flex h-8 items-center gap-2.5 rounded-lg text-[13.5px] font-medium outline-none transition-colors duration-150",
				minimal ? "mx-auto size-10 justify-center rounded-xl px-0" : "px-2.5",
				active ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
				dragOver && "bg-primary-soft text-primary-soft-foreground ring-1 ring-primary/40",
			)}
			{...dropProps}
		>
			{active && (
				<motion.span
					layoutId={`nav-pill-${layoutGroup}`}
					transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
					className="absolute inset-0 rounded-[inherit] bg-card shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.05),0_2px_6px_-2px_rgb(0_0_0/0.06)] dark:bg-accent dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
				/>
			)}
			<Icon
				className={cn(
					"relative size-[17px] shrink-0 transition-colors",
					active && !link.iconColor && "text-primary",
					!active && "text-subtle-foreground group-hover:text-muted-foreground",
				)}
				strokeWidth={active ? 2.1 : 1.85}
				style={link.iconColor ? { color: link.iconColor } : undefined}
			/>
			{!minimal && <span className="relative flex-1 truncate">{link.label}</span>}
			<NavCount count={link.count} minimal={minimal} emphasis={link.href === "/inbox"} />
		</Link>
	);

	return (
		<>
			<NavigationProgressBar progress={navigationProgress} />
			{minimal ? (
				<Tooltip label={link.label ?? ""} side="right">
					{anchor}
				</Tooltip>
			) : (
				anchor
			)}
		</>
	);
}
