"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { AnimatePresence, motion } from "motion/react";
import { ChevronsUpDown, Paperclip } from "lucide-react";
import { ContactAvatar } from "@/components/contacts/contact-avatar";
import { runSingleMessageAction } from "@/components/message-actions/utils";
import { sanitizeEmailHtml } from "@/app/(dashboard)/inbox/[messageId]/email-html-sanitizer";
import { getMessageBodyDisplay, resolveInlineAttachmentUrls } from "@/app/(dashboard)/inbox/[messageId]/utils";

import { cn } from "@/lib/utils";
import type { ConversationMessageCardProps, ConversationThreadProps } from "./conversation-thread-types";
import { ThreadMessageActions } from "./thread-message-actions";
import {
	getConversationRecipients,
	getConversationSender,
	getConversationSenderEmail,
	partitionThread,
} from "./conversation-thread-utils";
import clsx from "clsx";

/**
 * The other messages in a conversation, ordered oldest to newest and collapsed
 * until opened. Readers can also expand the full visible portion at once.
 */
export function ConversationThread({
	currentMessageId,
	position,
	messages,
	mailboxId,
	currentAccountName,
	ownAddress,
	ownAddresses,
	latestMessagesFirst,
	expandedAll,
	onExpandedAllChange,
}: ConversationThreadProps) {
	const slice = partitionThread(messages, currentMessageId, position, latestMessagesFirst);
	if (slice.length === 0) return null;
	const firstMessage = slice[0];
	const lastMessage = slice.at(-1)!;
	const middleMessages = slice.slice(1, -1);
	const collapsed = !expandedAll && middleMessages.length > 0;
	const collapsedLabel = `${middleMessages.length} ${position === "before" ? "older" : "newer"} message${middleMessages.length === 1 ? "" : "s"}`;

	return (
		<section
			aria-label={position === "before" ? "Earlier messages in this conversation" : "Later messages in this conversation"}
			className="mt-6"
		>
			<ol className="relative flex flex-col gap-2">
				<li>
					<ConversationMessageCard
						message={firstMessage}
						mailboxId={mailboxId}
						currentAccountName={currentAccountName}
						ownAddress={ownAddress}
						ownAddresses={ownAddresses}
					/>
				</li>
				{collapsed ? (
					<li className="relative flex items-center justify-center py-1">
						<span className="absolute inset-x-6 top-1/2 h-px bg-[repeating-linear-gradient(90deg,var(--border-strong)_0_4px,transparent_4px_8px)]" />
						<button
							type="button"
							onClick={() => onExpandedAllChange(true)}
							aria-label={`Expand ${collapsedLabel}`}
							className="relative inline-flex h-7 items-center gap-1.5 rounded-full bg-card px-3 text-xs font-medium text-muted-foreground shadow-[0_0_0_1px_var(--border-strong),0_1px_2px_rgb(0_0_0/0.05)] transition-all hover:-translate-y-px hover:text-foreground hover:shadow-panel"
						>
							<ChevronsUpDown className="size-3.5" />
							{collapsedLabel}
						</button>
					</li>
				) : (
					middleMessages.map((message) => (
						<li key={message.id}>
							<ConversationMessageCard
								message={message}
								mailboxId={mailboxId}
								currentAccountName={currentAccountName}
								ownAddress={ownAddress}
								ownAddresses={ownAddresses}
							/>
						</li>
					))
				)}
				{lastMessage.id !== firstMessage.id && (
					<li>
						<ConversationMessageCard
							message={lastMessage}
							mailboxId={mailboxId}
							currentAccountName={currentAccountName}
							ownAddress={ownAddress}
							ownAddresses={ownAddresses}
						/>
					</li>
				)}
			</ol>
		</section>
	);
}

export function ConversationMessageCard({
	message,
	mailboxId,
	currentAccountName,
	ownAddress,
	ownAddresses,
	defaultExpanded = false,
}: ConversationMessageCardProps) {
	const [locallyExpanded, setLocallyExpanded] = useState(defaultExpanded);
	const [locallyRead, setLocallyRead] = useState(message.read);
	const expanded = locallyExpanded;
	const sender = getConversationSender(message, currentAccountName);
	const senderEmail = getConversationSenderEmail(message);
	const recipients = getConversationRecipients(message);
	// const href = `${getMessageBackHref(message.direction, message.status)}/${message.id}`;
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
						const shouldExpand = !locallyExpanded;
						setLocallyExpanded(shouldExpand);
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
					{dayjs(message.createdAt).format("D MMM, HH:mm")}
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
						transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
