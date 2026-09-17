"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownNarrowWide, ArrowUpNarrowWide, ChevronsUpDown, Paperclip } from "lucide-react";
import { ContactAvatar } from "@/components/contacts/contact-avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { runSingleMessageAction } from "@/components/message-actions/utils";
import { sanitizeEmailHtml } from "@/app/(dashboard)/inbox/[messageId]/email-html-sanitizer";
import { getMessageBodyDisplay, resolveInlineAttachmentUrls } from "@/app/(dashboard)/inbox/[messageId]/utils";

import { cn } from "@/lib/utils";
import type { ConversationMessageCardProps, ConversationThreadProps } from "./conversation-thread-types";
import { ThreadMessageActions } from "./thread-message-actions";
import {
	formatThreadTime,
	formatThreadTimestampFull,
	getConversationRecipients,
	getConversationSender,
	getConversationSenderEmail,
	getThreadDayLabel,
	getThreadParticipants,
	isSameThreadDay,
	orderThreadMessages,
} from "./conversation-thread-utils";
import type { ThreadMessage } from "@/hooks/types";
import clsx from "clsx";

/** Read messages between the ends of a long thread are folded behind one control. */
const COLLAPSE_THRESHOLD = 3;

/**
 * The conversation as one ordered timeline. The message the reader opened is rendered in
 * its place among the others rather than above or below them, so the order on screen is
 * always the order the mail arrived in, in whichever direction the reader picked.
 */
export function ConversationThread({
	currentMessageId,
	current,
	messages,
	mailboxId,
	currentAccountName,
	ownAddress,
	ownAddresses,
	latestMessagesFirst,
	onLatestMessagesFirstChange,
	expandedAll,
	onExpandedAllChange,
}: ConversationThreadProps) {
	const ordered = orderThreadMessages(messages, latestMessagesFirst);
	// A single-message conversation is just the message.
	if (ordered.length <= 1) return <div className="mt-5">{current}</div>;

	const foldable = getFoldableRange(ordered, currentMessageId, expandedAll);
	const participants = getThreadParticipants(ordered, currentAccountName);
	const unreadCount = ordered.filter((message) => message.direction === "inbound" && !message.read).length;

	return (
		<section aria-label="Conversation" className="mt-5">
			<div className="mb-2 flex items-center gap-3 px-1">
				<p className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
					<span className="font-medium text-foreground">{ordered.length} messages</span>
					<span className="text-subtle-foreground"> · </span>
					{participants.join(", ")}
					{unreadCount > 0 && <span className="ml-1.5 font-medium text-primary">{unreadCount} unread</span>}
				</p>
				<Tooltip label={latestMessagesFirst ? "Show oldest first" : "Show newest first"}>
					<button
						type="button"
						onClick={() => onLatestMessagesFirstChange(!latestMessagesFirst)}
						className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						{latestMessagesFirst ? <ArrowUpNarrowWide className="size-3.5" /> : <ArrowDownNarrowWide className="size-3.5" />}
						{latestMessagesFirst ? "Newest first" : "Oldest first"}
					</button>
				</Tooltip>
			</div>

			<ol className="flex flex-col gap-1.5">
				{ordered.map((message, index) => {
					const previous = ordered[index - 1];
					const showDay = !previous || !isSameThreadDay(previous.createdAt, message.createdAt);
					if (foldable && index === foldable.start) {
						return (
							<li key="folded" className="relative flex items-center justify-center py-1.5">
								<span className="absolute inset-x-6 top-1/2 h-px bg-[repeating-linear-gradient(90deg,var(--border-strong)_0_4px,transparent_4px_8px)]" />
								<button
									type="button"
									onClick={() => onExpandedAllChange(true)}
									className="relative inline-flex h-7 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-medium text-muted-foreground shadow-[0_0_0_1px_var(--border-strong),0_1px_2px_rgb(0_0_0/0.05)] transition-all hover:-translate-y-px hover:text-foreground hover:shadow-panel"
								>
									<ChevronsUpDown className="size-3.5" />
									{foldable.count} more {foldable.count === 1 ? "message" : "messages"}
								</button>
							</li>
						);
					}
					if (foldable && index > foldable.start && index < foldable.end) return null;

					return (
						<li key={message.id}>
							{showDay && (
								<p className="px-1 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground first:pt-0">
									{getThreadDayLabel(message.createdAt)}
								</p>
							)}
							{message.id === currentMessageId ? (
								current
							) : (
								<ConversationMessageCard
									message={message}
									mailboxId={mailboxId}
									currentAccountName={currentAccountName}
									ownAddress={ownAddress}
									ownAddresses={ownAddresses}
								/>
							)}
						</li>
					);
				})}
			</ol>
		</section>
	);
}

/** The run of read, unopened messages in the middle worth folding away. */
function getFoldableRange(
	ordered: ThreadMessage[],
	currentMessageId: string,
	expandedAll: boolean,
): { start: number; end: number; count: number } | null {
	if (expandedAll) return null;
	const start = 1;
	const end = ordered.length - 1;
	const middle = ordered.slice(start, end);
	if (middle.length < COLLAPSE_THRESHOLD) return null;
	// Anything unread, or the message being read, stays visible.
	const keepsVisible = middle.some(
		(message) => message.id === currentMessageId || (message.direction === "inbound" && !message.read),
	);
	return keepsVisible ? null : { start, end, count: middle.length };
}

export function ConversationMessageCard({
	message,
	mailboxId,
	currentAccountName,
	ownAddress,
	ownAddresses,
	defaultExpanded = false,
}: ConversationMessageCardProps) {
	// Unread mail opens expanded: it is the part of the thread the reader has not seen.
	const [expanded, setExpanded] = useState(defaultExpanded || (message.direction === "inbound" && !message.read));
	const [locallyRead, setLocallyRead] = useState(message.read);
	const sender = getConversationSender(message, currentAccountName);
	const senderEmail = getConversationSenderEmail(message);
	const recipients = getConversationRecipients(message);
	const outbound = message.direction === "outbound";
	const attachments = message.attachments.filter((attachment) => attachment.disposition === "attachment");

	useEffect(() => setLocallyRead(message.read), [message.read]);

	let body: { html: string | null; text: string } | null = null;
	if (expanded) {
		const display = getMessageBodyDisplay(message.textBody, message.htmlBody, message.snippet);
		body = {
			html: sanitizeEmailHtml(resolveInlineAttachmentUrls(display.htmlBody, message.id, message.attachments)),
			text: display.latestContent,
		};
	}

	return (
		<article
			className={cn(
				"rounded-2xl border border-border bg-card px-4 transition-[box-shadow,border-color,background-color] duration-200 sm:px-5",
				expanded ? "shadow-[0_1px_2px_rgb(0_0_0/0.03)]" : "bg-elevated/50 hover:border-border-strong hover:bg-card",
			)}
		>
			<div className="flex w-full items-center gap-3 py-3">
				<button
					type="button"
					onClick={() => {
						const shouldExpand = !expanded;
						setExpanded(shouldExpand);
						if (!shouldExpand || locallyRead) return;
						setLocallyRead(true);
						void runSingleMessageAction(message.id, "read").catch(() => setLocallyRead(false));
					}}
					aria-expanded={expanded}
					className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-none"
				>
					<ContactAvatar
						mailboxId={mailboxId}
						address={message.fromAddr}
						name={sender}
						hasManagedAvatar={message.fromContactHasAvatar}
						managedAvatarUrl={outbound && mailboxId ? `/api/mailboxes/${mailboxId}/avatar` : undefined}
					/>
					<span className="min-w-0 flex-1">
						<span className="flex min-w-0 items-baseline gap-1.5">
							<span className={cn("truncate text-[13.5px]", locallyRead || outbound ? "font-medium text-foreground" : "font-semibold text-foreground")}>
								{sender}
							</span>
							{!locallyRead && !outbound && <span className="size-1.5 shrink-0 self-center rounded-full bg-primary" />}
							{expanded && <span className="truncate text-xs text-muted-foreground">{senderEmail}</span>}
						</span>
						{expanded && recipients ? (
							<span className="block truncate text-xs text-muted-foreground">to {recipients}</span>
						) : !expanded ? (
							<span className={clsx(!locallyRead ? "text-foreground/80" : "text-muted-foreground", "block truncate text-[13px]")}>{message.snippet || "No preview"}</span>
						) : null}
					</span>
				</button>
				<span className="flex shrink-0 items-center gap-2 text-xs tabular-nums text-subtle-foreground">
					{attachments.length > 0 && <Paperclip className="size-3.5" aria-label={`${attachments.length} attachments`} />}
					<Tooltip label={formatThreadTimestampFull(message.createdAt)}>
						<time dateTime={message.createdAt}>{formatThreadTime(message.createdAt)}</time>
					</Tooltip>
				</span>
				<ThreadMessageActions
					message={message}
					mailboxId={mailboxId}
					ownAddress={ownAddress}
					ownAddresses={ownAddresses}
				/>
			</div>
			<AnimatePresence initial={false}>
				{expanded && body && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
						className="overflow-hidden"
					>
						<div className="pb-5 pt-1">
							{body.html ? (
								<div className="email-paper">
									<div className="email-body max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: body.html }} />
								</div>
							) : (
								<pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-foreground">{body.text}</pre>
							)}
							{attachments.length > 0 && (
								<ul className="mt-4 flex flex-wrap gap-2">
									{attachments.map((attachment) => (
										<li key={attachment.id}>
											<a
												href={`/api/messages/${message.id}/attachments/${attachment.id}`}
												className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-xs font-medium text-foreground/80 ring-1 ring-inset ring-border transition-colors hover:bg-accent hover:text-foreground"
											>
												<Paperclip className="size-3" />
												<span className="max-w-48 truncate">{attachment.filename}</span>
											</a>
										</li>
									))}
								</ul>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</article>
	);
}
