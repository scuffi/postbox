"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Archive, ChevronLeft, ChevronRight, Clock, FolderOpen, Inbox, ListFilter, Mail, MailOpen, PenLine, SearchX, Send, ShieldCheck, Star, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ContactAvatar } from "@/components/contacts/contact-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { SkeletonRows } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { useCompose } from "@/components/compose/compose-context";
import { useMailSearch } from "@/components/mail-search/mail-search-context";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { usePageLoading } from "@/components/page-loading";
import { useMessageCounts } from "@/hooks/use-message-counts";
import { useMessages } from "@/hooks/use-messages";
import { AnimatePresence, motion } from "motion/react";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { Message } from "@/hooks/types";
import { setMessageDragData } from "@/lib/messages/drag-utils";
import { BulkMessageToolbar } from "./bulk-message-toolbar";
import { MessageListRowActions } from "./message-list-row-actions";
import { SwipeableRow } from "./swipeable-row";
import type { SwipeAction } from "./swipeable-row-types";
import { dispatchMessageCountsDelta, toggleMessageStar } from "./message-list-row-actions-utils";
import { domainColor } from "@/lib/domain-color";
import { MessageNavigationProgress, useMessageNavigation } from "./message-navigation";
import { useConversationView } from "./use-conversation-view";
import type { MessageFolderPageProps, MessageListRowProps, RowMessageAction } from "./types";
import {
	formatMessageListTimestamp,
	getPageRange,
	getMessageParty,
	getMessagePreview,
	isMessageListRowUnread,
	formatEmailPageTitle,
	getMailboxAddress,
	runBulkMessageAction,
} from "./utils";
import clsx from "clsx";

const pageSize = 25;

function MessageListRow({
	message,
	config,
	selected,
	active = false,
	compact = false,
	currentAccountName,
	showMailboxIndicator = false,
	onSelectedChange,
	onMessageAction,
	dragMessageIds,
}: MessageListRowProps) {
	const Icon = config.icon;
	const { openDraftComposer } = useCompose();
	const [read, setRead] = useState(message.read);
	const [threadUnread, setThreadUnread] = useState(message.threadUnread);
	const [starred, setStarred] = useState(message.starred);
	useEffect(() => setRead(message.read), [message.read]);
	useEffect(() => setThreadUnread(message.threadUnread), [message.threadUnread]);
	useEffect(() => setStarred(message.starred), [message.starred]);
	const rowMessage = { ...message, read, starred, threadUnread };
	const unread = isMessageListRowUnread(rowMessage);
	const draggable = config.folder === "inbox" && message.direction === "inbound";
	const party = getMessageParty(rowMessage, config.folder, currentAccountName);
	const preview = getMessagePreview(rowMessage, config.folder);
	const href = `${config.hrefPrefix}/${message.id}`;
	const navigation = useMessageNavigation(href, rowMessage);

	function onMessageNavigate(event: MouseEvent<HTMLAnchorElement>) {
		if (!read && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
			const previousThreadUnread = threadUnread;
			setRead(true);
			if (previousThreadUnread !== undefined) setThreadUnread(Math.max(0, previousThreadUnread - 1));
			if (message.direction === "inbound") dispatchMessageCountsDelta({ inboxUnreadDelta: -1 });
			void runBulkMessageAction([message.id], "read", false).catch(() => {
				setRead(false);
				setThreadUnread(previousThreadUnread);
				if (message.direction === "inbound") dispatchMessageCountsDelta({ inboxUnreadDelta: 1 });
			});
		}
		navigation.onNavigate(event, !read);
	}

	const accountDomain = message.accountAddress?.split("@")[1] ?? "";
	const mailboxChip = showMailboxIndicator && message.direction === "inbound" && message.accountName ? (
		<span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-foreground/[0.04] px-1.5 py-px text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
			<span className={clsx("size-1.5 shrink-0 rounded-full", domainColor(accountDomain).dot)} />
			{message.accountName}
		</span>
	) : null;
	const threadChip = (message.threadCount ?? 1) > 1 ? (
		<span className="shrink-0 rounded-md bg-muted px-1.5 text-[11px] font-medium leading-[18px] tabular-nums text-muted-foreground">
			{message.threadCount}
		</span>
	) : null;
	const avatarAddress = config.folder === "sent" ? message.toAddr : message.fromAddr;
	const lead = (
		<div className="relative flex size-8 shrink-0 items-center justify-center">
			{unread && (
				<span className="absolute -left-[13px] top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
			)}
			<span className={clsx("transition-[opacity,transform] duration-150", selected ? "scale-75 opacity-0" : "group-hover:scale-75 group-hover:opacity-0")}>
				{config.folder === "drafts" ? (
					<span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
						<PenLine className="size-3.5" />
					</span>
				) : (
					<ContactAvatar
						mailboxId={message.mailboxId}
						address={avatarAddress}
						name={party}
						hasManagedAvatar={config.folder !== "sent" && message.direction === "inbound" && !!message.fromContactHasAvatar}
						managedAvatarUrl={message.direction === "outbound" && config.folder !== "sent" && message.mailboxId ? `/api/mailboxes/${message.mailboxId}/avatar` : undefined}
					/>
				)}
			</span>
			<span className={clsx("absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-150", selected ? "scale-100 opacity-100" : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100")}>
				<Checkbox
					checked={selected}
					onChange={(event) => onSelectedChange(message.id, event.target.checked)}
					aria-label={`Select message from ${party}`}
				/>
			</span>
		</div>
	);

	if (compact && config.folder !== "drafts") {
		return (
			<div
				className={clsx(
					"group relative mx-2 flex gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150",
					active ? "bg-accent" : selected ? "bg-primary-soft/60" : "hover:bg-foreground/[0.03]",
					draggable && "cursor-grab active:cursor-grabbing",
				)}
				draggable={draggable}
				onDragStart={(event) => {
					if (!draggable) return;
					setMessageDragData(event.dataTransfer, { messageIds: dragMessageIds });
				}}
			>
				{active && (
					<motion.span
						layoutId={`active-row-${config.hrefPrefix}`}
						transition={{ type: "spring", stiffness: 500, damping: 40 }}
						className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-primary"
					/>
				)}
				<MessageNavigationProgress progress={navigation.progress} />
				<div className="pt-0.5">{lead}</div>
				<Link href={href} onClick={onMessageNavigate} className="min-w-0 flex-1 outline-none">
					<span className="flex items-center gap-2">
						<span className={clsx("min-w-0 flex-1 truncate text-[13.5px]", unread ? "font-semibold text-foreground" : "font-medium text-foreground/85")}>
							{party}
						</span>
						{threadChip}
						<time
							dateTime={message.createdAt}
							className={clsx("shrink-0 text-[11.5px] tabular-nums", unread ? "font-medium text-primary" : "text-subtle-foreground")}
						>
							{formatMessageListTimestamp(message.createdAt)}
						</time>
					</span>
					<span className={clsx("mt-0.5 block truncate text-[13px]", unread ? "font-medium text-foreground" : "text-foreground/75")}>
						{message.subject ?? "(no subject)"}
					</span>
					<span className="mt-0.5 flex items-center gap-2">
						<span className="min-w-0 flex-1 truncate text-[12.5px] leading-5 text-muted-foreground">{preview}</span>
						{starred && <Star className="size-3 shrink-0 fill-gold text-gold" />}
					</span>
					{mailboxChip && <span className="mt-1.5 flex">{mailboxChip}</span>}
				</Link>
			</div>
		);
	}

	async function handleRowAction(action: RowMessageAction) {
		const previousRead = read;
		const unreadDelta = action === "read" ? -1 : action === "unread" ? 1 : 0;
		if (action === "read") setRead(true);
		if (action === "unread") setRead(false);
		if (unreadDelta) dispatchMessageCountsDelta({ inboxUnreadDelta: unreadDelta });
		try {
			await onMessageAction(message.id, action);
		} catch (error) {
			if (action === "read" || action === "unread") {
				setRead(previousRead);
				if (unreadDelta) dispatchMessageCountsDelta({ inboxUnreadDelta: -unreadDelta });
			}
			throw error;
		}
	}

	// Touch gestures: swipe right toggles read, swipe left archives (or deletes where archiving makes no sense).
	const swipeLeading: SwipeAction | undefined = message.direction === "inbound"
		? unread
			? { label: "Read", icon: MailOpen, className: "bg-sky-600", onTrigger: () => handleRowAction("read").catch(() => undefined) }
			: { label: "Unread", icon: Mail, className: "bg-sky-600", onTrigger: () => handleRowAction("unread").catch(() => undefined) }
		: undefined;
	const swipeTrailing: SwipeAction | undefined =
		config.folder === "trash"
			? undefined
			: config.folder === "archived" || config.folder === "sent" || config.folder === "spam"
				? { label: "Delete", icon: Trash2, className: "bg-destructive", dismiss: true, onTrigger: () => handleRowAction("trash").catch(() => undefined) }
				: { label: "Archive", icon: Archive, className: "bg-emerald-600", dismiss: true, onTrigger: () => handleRowAction("archive").catch(() => undefined) };

	const className = clsx(
		"group relative flex min-h-[64px] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 sm:h-[52px] sm:min-h-[52px] sm:py-0",
		active || selected ? "bg-primary-soft/60 dark:bg-primary-soft/50" : "hover:bg-foreground/[0.03]",
		draggable && "cursor-grab active:cursor-grabbing",
	);
	const content = (
		<>
			<span className="flex min-w-0 shrink-0 items-center gap-2 max-sm:order-1 sm:w-[150px] lg:w-[200px]">
				<span className={clsx("min-w-0 truncate text-[13.5px]", unread ? "font-semibold text-foreground" : "font-medium text-foreground/85", config.folder === "drafts" && "text-primary")}>
					{party}
				</span>
				{threadChip}
			</span>
			<span className="flex min-w-0 flex-1 items-center gap-2.5 max-sm:order-3 max-sm:col-span-2">
				{mailboxChip && <span className="hidden w-[112px] shrink-0 overflow-hidden xl:flex [&>span]:max-w-full [&>span]:truncate">{mailboxChip}</span>}
				<span className="min-w-0 truncate text-[13.5px]">
					<span className={unread ? "font-semibold text-foreground" : "text-foreground/85"}>
						{rowMessage.subject ?? "(no subject)"}
					</span>
					<span className="text-muted-foreground"> — {getMessagePreview(rowMessage, config.folder)}</span>
				</span>
			</span>
			<span className="flex shrink-0 items-center gap-1 pl-2 max-sm:order-2">
				{config.folder === "inbox" && message.direction === "inbound" && (
					<Tooltip label={starred ? "Unstar" : "Star"}>
						<button
							type="button"
							onClick={(event) => {
								event.preventDefault();
								event.stopPropagation();
								void toggleMessageStar(message.id).then((result) => setStarred(result.starred));
							}}
							aria-label={starred ? "Starred" : "Not starred"}
							className={clsx(
								"flex size-7 items-center justify-center rounded-lg transition-[opacity,background-color] hover:bg-gold-soft",
								starred ? "opacity-100" : "opacity-0 group-hover:opacity-100 pointer-coarse:hidden",
							)}
						>
							<motion.span key={String(starred)} initial={{ scale: 0.4, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 15 }} className="flex">
								<Icon className={clsx("size-[15px]", starred ? "fill-gold text-gold" : "text-subtle-foreground")} />
							</motion.span>
						</button>
					</Tooltip>
				)}
				{(config.folder !== "inbox" || message.direction !== "inbound") && starred && (
					<Star className="size-3.5 fill-gold text-gold" />
				)}
				<time
					dateTime={message.createdAt}
					className={clsx(
						"min-w-[64px] whitespace-nowrap text-right text-[12px] tabular-nums transition-opacity",
						(config.folder === "inbox" || config.folder === "snoozed") && message.direction === "inbound" && "pointer-fine:group-hover:opacity-0",
						unread ? "font-medium text-primary" : "text-subtle-foreground",
					)}
				>
					{formatMessageListTimestamp(message.createdAt)}
				</time>
			</span>
		</>
	);

	if (config.folder === "drafts") {
		return (
			<div className={clsx(className, "mx-2")}>
				{lead}
				<button type="button" className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-left outline-none sm:flex" onClick={() => openDraftComposer(message.id)}>
					{content}
				</button>
			</div>
		);
	}

	return (
		<SwipeableRow className="mx-2 rounded-xl" leading={swipeLeading} trailing={swipeTrailing}>
			<div
				className={className}
				draggable={draggable}
				onDragStart={(event) => {
					if (!draggable) return;
					setMessageDragData(event.dataTransfer, { messageIds: dragMessageIds });
				}}
			>
				<MessageNavigationProgress progress={navigation.progress} />
				{lead}
				<Link href={href} onClick={onMessageNavigate} className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-3 self-stretch outline-none sm:flex">
					{content}
				</Link>
				{(config.folder === "inbox" || config.folder === "snoozed") && message.direction === "inbound" && (
					<MessageListRowActions message={rowMessage} onAction={handleRowAction} />
				)}
			</div>
		</SwipeableRow>
	);
}

const emptyStates: Record<string, { icon: LucideIcon; title: string; description: string }> = {
	inbox: { icon: Inbox, title: "Inbox zero", description: "Nothing waiting for you. New mail will slide in here the moment it arrives." },
	starred: { icon: Star, title: "Nothing starred", description: "Star the messages worth coming back to and they'll collect here." },
	snoozed: { icon: Clock, title: "No snoozed mail", description: "Snooze a message to tuck it away until the moment you need it." },
	sent: { icon: Send, title: "Nothing sent yet", description: "Messages you send from any of your addresses appear here." },
	drafts: { icon: PenLine, title: "No drafts", description: "Unfinished messages are saved here automatically." },
	archived: { icon: Archive, title: "Archive is empty", description: "Archive mail to clear your inbox without deleting anything." },
	spam: { icon: ShieldCheck, title: "No spam", description: "Suspicious mail is quarantined here. All clear for now." },
	trash: { icon: Trash2, title: "Trash is empty", description: "Deleted messages rest here before they're gone for good." },
};

export function MessageFolderPage({
	config,
	compact = false,
	selectedMessageId,
	selection,
}: MessageFolderPageProps) {
	const { selectedMailbox, isLoading: mailboxesLoading } = useSelectedMailbox();
	const { query } = useMailSearch();
	const [offset, setOffset] = useState(0);
	const [internalSelectedMessages, setInternalSelectedMessages] = useState<
		Array<{ id: string; read: boolean }>
	>([]);
	const [pendingBulkAction, setPendingBulkAction] = useState(false);
	const [unreadOnly, setUnreadOnly] = useState(false);
	const [conversationView] = useConversationView();
	const grouped = conversationView && config.folder !== "drafts";
	const { messages, isLoading, total, limit, updateMessages } = useMessages(config.folder, selectedMailbox?.id, {
		query,
		limit: pageSize,
		offset,
		read: unreadOnly ? "unread" : "all",
		group: grouped ? "thread" : undefined,
	}, !mailboxesLoading, config.folderId);
	const { counts } = useMessageCounts(selectedMailbox?.id, !mailboxesLoading);
	usePageLoading(mailboxesLoading || isLoading);
	const headerIcons = config.headerIcons ?? [];
	const hasActiveFilters = !!query.trim();
	const folderCount = config.folderId
		? counts.customFolders[config.folderId]
		: counts.folders[config.folder];
	const titleTotal = folderCount?.total ?? total;
	const titleUnread = folderCount?.unread ?? 0;
	const mailboxAddress = getMailboxAddress(selectedMailbox);
	const currentAccountName = selectedMailbox?.displayName ?? selectedMailbox?.localPart;
	const pageRange = getPageRange(offset, messages.length, total);
	const selectedMessages = selection?.selectedMessages ?? internalSelectedMessages;
	const setSelectedMessages =
		selection?.setSelectedMessages ?? setInternalSelectedMessages;
	const selectedIds = useMemo(
		() => selectedMessages.map((message) => message.id),
		[selectedMessages],
	);
	const hasUnreadSelection = selectedMessages.some((message) => !message.read);
	const allVisibleSelected = messages.length > 0 && messages.every((message) => selectedIds.includes(message.id));
	// In conversation view a row stands for every message of its thread in this
	// folder, so actions and drags carry all of them.
	const rowMessageIds = (message: Message) => message.threadMessageIds ?? [message.id];
	const expandSelectedIds = (ids: string[]) =>
		ids.flatMap((id) => rowMessageIds(messages.find((message) => message.id === id) ?? { id } as Message));

	useEffect(() => {
		setOffset(0);
		setSelectedMessages([]);
	}, [query, selectedMailbox?.id, config.folder, config.folderId, unreadOnly, grouped]);

	useEffect(() => {
		setSelectedMessages([]);
	}, [offset]);

	useEffect(() => {
		if (mailboxesLoading) return;
		document.title = formatEmailPageTitle({
			location: config.title,
			total: titleTotal,
			unread: titleUnread,
			emailAddress: mailboxAddress,
		});
	}, [config.title, mailboxAddress, mailboxesLoading, titleTotal, titleUnread]);

	function updateSelectedMessage(messageId: string, selected: boolean) {
		const message = messages.find((item) => item.id === messageId);
		if (!message) return;

		setSelectedMessages((current) => {
			if (!selected) return current.filter((item) => item.id !== messageId);
			if (current.some((item) => item.id === messageId)) return current;
			return [...current, { id: message.id, read: message.read && !(message.threadUnread ?? 0) }];
		});
	}

	function toggleAllVisible(selected: boolean) {
		const visibleIds = new Set(messages.map((message) => message.id));
		setSelectedMessages((current) => {
			if (!selected) {
				return current.filter((message) => !visibleIds.has(message.id));
			}

			const next = new Map(current.map((message) => [message.id, message]));
			for (const message of messages) {
				next.set(message.id, { id: message.id, read: message.read && !(message.threadUnread ?? 0) });
			}
			return Array.from(next.values());
		});
	}

	async function runSelectedAction(action: BulkMessageAction) {
		if (selectedIds.length === 0) return;

		setPendingBulkAction(true);
		const previousMessages = messages;
		const readValue = action === "read" ? true : action === "unread" ? false : null;
		const changedMessages = readValue === null
			? []
			: messages.filter((message) => selectedIds.includes(message.id) && message.read !== readValue);
		if (readValue !== null) {
			updateMessages((current) => current.map((message) =>
				selectedIds.includes(message.id) ? { ...message, read: readValue } : message,
			));
			setSelectedMessages((current) => current.map((message) => ({ ...message, read: readValue })));
			const inboxUnreadDelta = changedMessages
				.filter((message) => message.direction === "inbound")
				.reduce((total, message) => total + (readValue ? (message.read ? 0 : -1) : (message.read ? 1 : 0)), 0);
			if (inboxUnreadDelta) dispatchMessageCountsDelta({ inboxUnreadDelta });
		}
		try {
			await runBulkMessageAction(expandSelectedIds(selectedIds), action);
			setSelectedMessages([]);
		} catch (error) {
			if (readValue !== null) {
				updateMessages(previousMessages);
				const inboxUnreadDelta = changedMessages
					.filter((message) => message.direction === "inbound")
					.reduce((total, message) => total + (readValue ? (message.read ? 0 : 1) : (message.read ? -1 : 0)), 0);
				if (inboxUnreadDelta) dispatchMessageCountsDelta({ inboxUnreadDelta });
			}
			throw error;
		} finally {
			setPendingBulkAction(false);
		}
	}

	const emptyState = config.folderId
		? { icon: FolderOpen, title: "Folder is empty", description: "Drag messages onto this folder in the sidebar to file them here." }
		: emptyStates[config.folder] ?? { icon: Inbox, title: config.emptyText, description: "" };
	const showFloatingBar = selectedIds.length > 0 && !compact;

	return (
		<div className="relative flex h-full min-h-0 flex-col">
			<div className={clsx("flex shrink-0 items-center gap-3 border-b border-border", compact ? "h-14 px-5" : "h-16 px-5 sm:px-6")}>
				<Tooltip label="Select all visible">
					<Checkbox
						checked={allVisibleSelected}
						disabled={messages.length === 0}
						onChange={(event) => toggleAllVisible(event.target.checked)}
						aria-label="Select all visible messages"
					/>
				</Tooltip>
				<div className="flex min-w-0 flex-1 items-baseline gap-2.5 pl-1">
					<h1 className={clsx("truncate text-foreground", compact ? "text-[15px] font-semibold tracking-[-0.01em]" : "font-display text-[28px] leading-none")}>
						{config.title}
					</h1>
					<AnimatePresence mode="popLayout" initial={false}>
						{titleUnread > 0 && (
							<motion.span
								key={titleUnread}
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -4 }}
								className="shrink-0 text-[12.5px] font-medium tabular-nums text-primary"
							>
								{titleUnread} unread
							</motion.span>
						)}
					</AnimatePresence>
				</div>
				<div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
					{config.folder === "inbox" && !compact && (
						<Segmented
							size="sm"
							value={unreadOnly ? "unread" : "all"}
							onChange={(value) => setUnreadOnly(value === "unread")}
							options={[
								{ value: "all", label: "All" },
								{ value: "unread", label: "Unread" },
							]}
							className="mr-2 hidden sm:inline-flex"
						/>
					)}
					{config.folder === "inbox" && compact && (
						<Tooltip label={unreadOnly ? "Showing unread only" : "Show unread only"}>
							<Button
								type="button"
								variant="ghost"
								size="icon-xs"
								aria-label="Show unread emails only"
								aria-pressed={unreadOnly}
								onClick={() => setUnreadOnly((current) => !current)}
								className={unreadOnly ? "bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft" : undefined}
							>
								<ListFilter />
							</Button>
						</Tooltip>
					)}
					<span className={clsx("whitespace-nowrap text-xs tabular-nums text-subtle-foreground", compact && "hidden xl:inline")}>
						{pageRange.start}–{pageRange.end} of {pageRange.total}
					</span>
					<div className="flex items-center">
						<Tooltip label="Newer">
							<Button
								variant="ghost"
								size="icon-xs"
								disabled={offset === 0 || isLoading}
								onClick={() => setOffset(Math.max(offset - limit, 0))}
								aria-label="Previous page"
							>
								<ChevronLeft />
							</Button>
						</Tooltip>
						<Tooltip label="Older">
							<Button
								variant="ghost"
								size="icon-xs"
								disabled={offset + messages.length >= total || isLoading}
								onClick={() => setOffset(offset + limit)}
								aria-label="Next page"
							>
								<ChevronRight />
							</Button>
						</Tooltip>
					</div>
					{!compact && headerIcons.map((HeaderIcon, index) => (
						<HeaderIcon key={index} className="size-4" />
					))}
				</div>
			</div>

			<div className={clsx("min-h-0 flex-1 overflow-y-auto overscroll-contain py-2 scrollbar-gutter-stable", showFloatingBar && "pb-24")}>
				<AnimatePresence initial={false}>
					{messages.map((message, index) => (
						<motion.div
							key={message.id}
							layout="position"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1], delay: Math.min(index * 0.018, 0.25) } }}
							exit={{ opacity: 0, x: -24, height: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
							className={compact ? "py-px" : undefined}
						>
							<MessageListRow
								message={message}
								config={config}
								selected={selectedIds.includes(message.id)}
								active={message.id === selectedMessageId}
								compact={compact}
								currentAccountName={currentAccountName}
								showMailboxIndicator={!selectedMailbox}
								onSelectedChange={updateSelectedMessage}
								onMessageAction={(messageId, action) =>
									runBulkMessageAction(expandSelectedIds([messageId]), action, action !== "read" && action !== "unread")
								}
								dragMessageIds={expandSelectedIds(selectedIds.includes(message.id) ? selectedIds : [message.id])}
							/>
						</motion.div>
					))}
				</AnimatePresence>
				{isLoading && messages.length === 0 && <SkeletonRows count={8} compact={compact} />}
				{!isLoading && messages.length === 0 && (
					hasActiveFilters ? (
						<EmptyState icon={SearchX} title="No matches" description="No messages match this search. Try fewer words or a different sender." className={compact ? "py-12" : "py-24"} />
					) : (
						<EmptyState icon={emptyState.icon} title={emptyState.title} description={emptyState.description} className={compact ? "py-12" : "py-24"} />
					)
				)}
			</div>

			<AnimatePresence>
				{showFloatingBar && (
					<motion.div
						initial={{ opacity: 0, y: 24, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.15 } }}
						transition={{ type: "spring", stiffness: 480, damping: 34 }}
						className="pointer-events-none absolute inset-x-0 bottom-5 z-20 flex justify-center px-4"
					>
						<div className="pointer-events-auto rounded-2xl bg-popover p-1.5 shadow-float">
							<BulkMessageToolbar
								selectedCount={selectedIds.length}
								hasUnreadSelection={hasUnreadSelection}
								onAction={runSelectedAction}
								onClearSelection={() => setSelectedMessages([])}
								pending={pendingBulkAction}
							/>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
