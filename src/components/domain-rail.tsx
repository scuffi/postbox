"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Inbox, Plus } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSelectedMailbox } from "./mailbox-provider";
import { useMessageCounts } from "@/hooks/use-message-counts";
import { useSidebar } from "./sidebar-state";
import { NavCount } from "./components-nav";
import { SidebarSection } from "./app-shell";
import { getDomainInitial, getMailboxRailLabel, groupMailboxesByDomain } from "./domain-rail-utils";
import { domainColor } from "@/lib/domain-color";
import type { DomainColor } from "@/lib/domain-color";
import type { DomainGroup } from "./domain-rail-utils";

type RailMailbox = ReturnType<typeof useSelectedMailbox>["mailboxes"][number];

function RailPill() {
	return (
		<motion.span
			layoutId="rail-pill"
			transition={{ type: "spring", stiffness: 520, damping: 42, mass: 0.8 }}
			className="absolute inset-0 rounded-[inherit] bg-card shadow-[0_0_0_1px_var(--border),0_1px_2px_rgb(0_0_0/0.05),0_2px_6px_-2px_rgb(0_0_0/0.06)] dark:bg-accent dark:shadow-[0_0_0_1px_rgb(255_255_255/0.06)]"
		/>
	);
}

function MailboxRailItem({
	mailbox,
	active,
	unread,
	color,
	onSelect,
}: {
	mailbox: RailMailbox;
	active: boolean;
	unread: number;
	color: DomainColor;
	onSelect: () => void;
}) {
	const label = getMailboxRailLabel(mailbox);
	return (
		<button
			type="button"
			onClick={onSelect}
			title={`${mailbox.localPart}@${mailbox.hostname}`}
			className={cn(
				"group relative flex h-8 w-full items-center gap-2 rounded-lg pl-2.5 pr-2.5 text-[13px] transition-colors",
				active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
			)}
		>
			{active && <RailPill />}
			<span className={cn("relative size-1.5 shrink-0 rounded-full transition-transform group-hover:scale-125", color.dot)} />
			<span className="relative min-w-0 flex-1 truncate text-left">{label}</span>
			<NavCount count={unread} />
		</button>
	);
}

function DomainGroupSection({
	group,
	selectedMailboxId,
	unreadByMailbox,
	color,
	onSelect,
}: {
	group: DomainGroup;
	selectedMailboxId: string | null;
	unreadByMailbox: Map<string, number>;
	color: DomainColor;
	onSelect: (mailbox: RailMailbox) => void;
}) {
	const [open, setOpen] = useState(true);
	const groupUnread = group.mailboxes.reduce((sum, mailbox) => sum + (unreadByMailbox.get(mailbox.id) ?? 0), 0);
	const anyActive = group.mailboxes.some((mailbox) => mailbox.id === selectedMailboxId);

	return (
		<div className="flex flex-col">
			<div
				className={cn(
					"group flex h-8 w-full items-center rounded-lg pr-1 transition-colors hover:bg-foreground/[0.04]",
					anyActive ? "text-foreground" : "text-muted-foreground",
				)}
			>
				<button
					type="button"
					onClick={() => setOpen((value) => !value)}
					aria-expanded={open}
					className="flex h-full min-w-0 flex-1 items-center gap-2 pl-1.5 text-left text-[13px] font-medium"
				>
					<span
						className={cn(
							"flex size-5 shrink-0 items-center justify-center rounded-md text-[10.5px] font-semibold",
							color.soft,
							color.text,
						)}
					>
						{getDomainInitial(group.hostname)}
					</span>
					<span className="min-w-0 flex-1 truncate">{group.hostname}</span>
					{!open && <NavCount count={groupUnread} />}
					<ChevronRight
						className={cn(
							"size-3.5 shrink-0 text-subtle-foreground opacity-0 transition-[transform,opacity] duration-200 group-hover:opacity-100",
							open && "rotate-90",
						)}
					/>
				</button>
				<Tooltip label={`Add an address on ${group.hostname}`} side="right">
					<Link
						href="/mailboxes"
						className="flex size-6 shrink-0 items-center justify-center rounded-md text-subtle-foreground opacity-0 transition-[opacity,background-color] hover:bg-accent hover:text-foreground group-hover:opacity-100"
					>
						<Plus className="size-3.5" />
					</Link>
				</Tooltip>
			</div>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
						className="overflow-hidden"
					>
						<div className="relative ml-[15px] flex flex-col gap-px border-l border-border py-0.5 pl-1.5">
							{group.mailboxes.map((mailbox) => (
								<MailboxRailItem
									key={mailbox.id}
									mailbox={mailbox}
									active={mailbox.id === selectedMailboxId}
									unread={unreadByMailbox.get(mailbox.id) ?? 0}
									color={color}
									onSelect={() => onSelect(mailbox)}
								/>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

export function DomainRail() {
	const { selectedMailbox, setSelectedMailbox, mailboxes, isLoading } = useSelectedMailbox();
	const { minimal } = useSidebar();
	const { counts } = useMessageCounts(null, !isLoading);

	if (isLoading) return null;

	const groups = groupMailboxesByDomain(mailboxes);
	const unreadByMailbox = new Map((counts.mailboxes ?? []).map((entry) => [entry.mailboxId, entry.unread]));
	const allUnread = counts.folders.inbox.unread;
	const allActive = selectedMailbox === null;

	if (minimal) {
		return (
			<SidebarSection>
				<div className="flex flex-col items-center gap-1">
					<Tooltip label="All inboxes" side="right">
						<button
							type="button"
							onClick={() => setSelectedMailbox(null)}
							className={cn(
								"relative flex size-10 items-center justify-center rounded-xl transition-colors",
								allActive ? "bg-card text-primary shadow-panel dark:bg-accent" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
							)}
						>
							<Inbox className="size-[17px]" />
							<NavCount count={allUnread} minimal />
						</button>
					</Tooltip>
					{groups.map((group) => {
						const color = domainColor(group.hostname);
						const active = group.mailboxes.some((mailbox) => mailbox.id === selectedMailbox?.id);
						return (
							<Tooltip key={group.hostname} label={group.hostname} side="right">
								<button
									type="button"
									onClick={() => {
										if (!active && group.mailboxes[0]) setSelectedMailbox(group.mailboxes[0]);
									}}
									className={cn(
										"relative flex size-10 items-center justify-center rounded-xl text-[13px] font-semibold transition-all",
										active ? cn(color.solid, "text-white shadow-panel") : cn(color.soft, color.text, "hover:scale-105"),
									)}
								>
									{getDomainInitial(group.hostname)}
									<NavCount
										count={group.mailboxes.reduce((sum, mailbox) => sum + (unreadByMailbox.get(mailbox.id) ?? 0), 0)}
										minimal
									/>
								</button>
							</Tooltip>
						);
					})}
				</div>
			</SidebarSection>
		);
	}

	return (
		<SidebarSection
			label="Inboxes"
			action={
				<Tooltip label="Add a domain" side="right">
					<Link
						href="/domains"
						className="flex size-6 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						<Plus className="size-3.5" />
					</Link>
				</Tooltip>
			}
		>
			<button
				type="button"
				onClick={() => setSelectedMailbox(null)}
				className={cn(
					"group relative flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] font-medium transition-colors",
					allActive ? "text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
				)}
			>
				{allActive && <RailPill />}
				<Inbox
					className={cn("relative size-[17px] shrink-0", allActive ? "text-primary" : "text-subtle-foreground")}
					strokeWidth={allActive ? 2.1 : 1.85}
				/>
				<span className="relative flex-1 text-left">All inboxes</span>
				<NavCount count={allUnread} emphasis />
			</button>

			{groups.map((group) => (
				<DomainGroupSection
					key={group.hostname}
					group={group}
					selectedMailboxId={selectedMailbox?.id ?? null}
					unreadByMailbox={unreadByMailbox}
					color={domainColor(group.hostname)}
					onSelect={setSelectedMailbox}
				/>
			))}
		</SidebarSection>
	);
}
