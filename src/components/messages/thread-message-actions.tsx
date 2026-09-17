"use client";

import { createElement, useEffect, useState } from "react";
import { Ban, Forward, Mail, MailOpen, MoreHorizontal, Reply, ReplyAll, Star } from "lucide-react";
import { motion } from "motion/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCompose } from "@/components/compose/compose-context";
import { getOwnAddressForMessage } from "@/app/(dashboard)/inbox/[messageId]/utils";
import { Tooltip } from "@/components/ui/tooltip";
import {
	blockMessageContact,
	createForwardDraft,
	createReplyDraft,
	getMoveMessageActions,
	getReplyRecipients,
	getReplyThreading,
	hasAdditionalRecipients,
	runSingleMessageAction,
} from "@/components/message-actions/utils";
import { toggleMessageStar } from "./message-list-row-actions-utils";
import type { ThreadMessageActionsProps } from "./thread-message-actions-types";
import type { ReplyMode } from "@/components/message-actions/types";

const iconButton =
	"flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4";

export function ThreadMessageActions({
	message,
	mailboxId,
	ownAddress,
	ownAddresses = [],
}: ThreadMessageActionsProps) {
	const { openDraftComposer } = useCompose();
	const [starred, setStarred] = useState(message.starred);
	const [moreOpen, setMoreOpen] = useState(false);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const canReplyAll = hasAdditionalRecipients(message, ownAddresses);
	const moveActions = getMoveMessageActions(message.status, message.direction);
	const replyFromAddress = ownAddresses.length > 0
		? getOwnAddressForMessage(message, ownAddresses)
		: ownAddress;

	useEffect(() => setStarred(message.starred), [message.starred]);

	async function onToggleStar() {
		setPending(true);
		setError(null);
		try {
			setStarred((await toggleMessageStar(message.id)).starred);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Unable to update star");
		} finally {
			setPending(false);
		}
	}

	async function onReply(mode: ReplyMode) {
		setMoreOpen(false);
		setPending(true);
		setError(null);
		try {
			const draftId = await createReplyDraft({
				mailboxId,
				senderAddress: message.fromAddr,
				ownAddress: replyFromAddress,
				subject: message.subject,
				bodyText: message.textBody,
				bodyHtml: message.htmlBody,
				sentAt: message.createdAt,
				recipients: getReplyRecipients(message, ownAddresses, mode),
				threading: getReplyThreading(message),
			});
			openDraftComposer(draftId);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Could not start reply");
		} finally {
			setPending(false);
		}
	}

	async function onForward() {
		setMoreOpen(false);
		setPending(true);
		setError(null);
		try {
			const draftId = await createForwardDraft({
				mailboxId,
				ownAddress: replyFromAddress,
				message,
				bodyText: message.textBody,
				bodyHtml: message.htmlBody,
			});
			openDraftComposer(draftId);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Could not start forward");
		} finally {
			setPending(false);
		}
	}

	async function onMessageAction(action: Parameters<typeof runSingleMessageAction>[1]) {
		setMoreOpen(false);
		setPending(true);
		setError(null);
		try {
			await runSingleMessageAction(message.id, action);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Could not update message");
		} finally {
			setPending(false);
		}
	}

	async function onBlock() {
		if (!mailboxId) return;
		setMoreOpen(false);
		setPending(true);
		setError(null);
		try {
			await blockMessageContact({ mailboxId, senderAddress: message.fromAddr });
			await runSingleMessageAction(message.id, "trash");
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Could not block contact");
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex items-center gap-0.5">
			{error && <span className="mr-1 max-w-32 truncate text-xs text-destructive" title={error}>{error}</span>}
			<Tooltip label={starred ? "Remove star" : "Star"}>
				<button
					type="button"
					className={cn(iconButton, "hover:bg-gold-soft")}
					aria-label={starred ? "Remove star" : "Star"}
					aria-pressed={starred}
					disabled={pending}
					onClick={() => void onToggleStar()}
				>
					<motion.span key={String(starred)} initial={{ scale: 0.5, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 600, damping: 15 }} className="flex">
						<Star className={starred ? "fill-gold text-gold" : undefined} />
					</motion.span>
				</button>
			</Tooltip>
			<Tooltip label="Reply">
				<button type="button" className={iconButton} aria-label="Reply" disabled={pending} onClick={() => void onReply("reply")}>
					<Reply />
				</button>
			</Tooltip>
			<DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
				<Tooltip label="More">
					<DropdownMenuTrigger asChild>
						<button type="button" className={iconButton} aria-label="More actions" disabled={pending}>
							<MoreHorizontal />
						</button>
					</DropdownMenuTrigger>
				</Tooltip>
				<DropdownMenuContent align="end" className="w-52">
					<DropdownMenuItem onSelect={() => void onReply("reply")}>
						<Reply /> Reply
					</DropdownMenuItem>
					{canReplyAll && (
						<DropdownMenuItem onSelect={() => void onReply("replyAll")}>
							<ReplyAll /> Reply all
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onSelect={() => void onForward()}>
						<Forward /> Forward
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onSelect={() => void onMessageAction(message.read ? "unread" : "read")}>
						{message.read ? <Mail /> : <MailOpen />}
						{message.read ? "Mark as unread" : "Mark as read"}
					</DropdownMenuItem>
					{moveActions.map((item) => (
						<DropdownMenuItem key={item.action} onSelect={() => void onMessageAction(item.action)}>
							{createElement(item.icon)} {item.label}
						</DropdownMenuItem>
					))}
					{message.direction === "inbound" && mailboxId && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem destructive onSelect={() => void onBlock()}>
								<Ban /> Block contact
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
