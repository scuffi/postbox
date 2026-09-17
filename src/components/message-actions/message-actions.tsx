"use client";

import { createElement, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, BellOff, Forward, Mail, MailOpen, MoreHorizontal, Reply, ReplyAll, ShieldAlert, Trash2 } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useCompose } from "@/components/compose/compose-context";
import { useHotkeys, useShortcuts } from "@/components/shortcuts";
import { Tooltip } from "@/components/ui/tooltip";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { MessageActionsProps, ReplyMode } from "./types";
import {
	confirmTrashWithoutUnsubscribe,
	blockMessageContact,
	createForwardDraft,
	createReplyDraft,
	createTrashSenderRule,
	getMessageActionRedirect,
	getMoveMessageActions,
	getReplyRecipients,
	getReplyThreading,
	hasAdditionalRecipients,
	openUnsubscribeUrl,
	runSingleMessageAction,
} from "./utils";

const iconButton =
	"flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35 [&_svg]:size-4";
const groupButton =
	"flex h-7 items-center gap-1.5 rounded-[9px] px-2 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-card hover:text-foreground hover:shadow-[0_1px_2px_rgb(0_0_0/0.06)] disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-accent [&_svg]:size-4";

export function MessageActions({
	messageId,
	mailboxId,
	senderAddress,
	direction,
	status,
	read,
	unsubscribeUrl,
	subject,
	bodyText,
	ownAddress,
	ownAddresses = [],
	message,
	messageMeta,
	bodyHtml,
}: MessageActionsProps) {
	const router = useRouter();
	const { openDraftComposer } = useCompose();
	const { shortcutsEnabled } = useShortcuts();
	const [pendingAction, setPendingAction] = useState<
		BulkMessageAction | "unsubscribe" | ReplyMode | "forward" | "block" | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [moreOpen, setMoreOpen] = useState(false);

	const runAction = useCallback(async (action: BulkMessageAction) => {
		setMoreOpen(false);
		setPendingAction(action);
		setError(null);
		try {
			await runSingleMessageAction(messageId, action);
			const redirect = getMessageActionRedirect(action, direction);
			if (redirect) router.push(redirect);
			router.refresh();
		} catch {
			setError("Could not update message");
		} finally {
			setPendingAction(null);
		}
	}, [messageId, direction, router]);

	const replyable = useMemo(() => message ?? {
		direction,
		fromAddr: senderAddress,
		toAddr: "",
		ccAddr: null,
		providerMessageId: null,
		references: null,
		threadId: null,
	}, [message, direction, senderAddress]);
	const canReplyAll = hasAdditionalRecipients(replyable, ownAddresses);

	const handleReply = useCallback(async (mode: ReplyMode) => {
		setPendingAction(mode);
		setError(null);
		try {
			const draftId = await createReplyDraft({
				mailboxId,
				senderAddress,
				ownAddress,
				subject,
				bodyText,
				bodyHtml,
				sentAt: messageMeta?.createdAt,
				recipients: getReplyRecipients(replyable, ownAddresses, mode),
				threading: getReplyThreading(replyable),
			});
			openDraftComposer(draftId);
		} catch (replyError) {
			setError(replyError instanceof Error ? replyError.message : "Could not start reply");
		} finally {
			setPendingAction(null);
		}
	}, [mailboxId, senderAddress, ownAddress, subject, bodyText, bodyHtml, messageMeta?.createdAt, replyable, ownAddresses, openDraftComposer]);

	const shortcuts = useMemo(
		() => [
			{
				key: "e",
				label: "Archive Message",
				category: "Actions" as const,
				action: () => {
					if (status !== "archived") void runAction("archive");
				},
			},
			{
				key: "y",
				label: "Archive Message",
				category: "Actions" as const,
				action: () => {
					if (status !== "archived") void runAction("archive");
				},
			},
			{
				key: "#",
				label: "Move to Trash",
				category: "Actions" as const,
				action: () => {
					if (status !== "trash") void runAction("trash");
				},
			},
			{
				key: "r",
				label: "Reply to Message",
				category: "Composing" as const,
				action: () => void handleReply("reply"),
			},
			{
				key: "!",
				label: "Report Spam",
				category: "Actions" as const,
				action: () => {
					if (status !== "spam" && direction === "inbound") void runAction("spam");
				},
			},
			{
				key: "u",
				label: "Back to List",
				category: "Navigation" as const,
				action: () => router.back(),
			},
		],
		[status, direction, runAction, handleReply, router]
	);

	useHotkeys(shortcuts, { enabled: shortcutsEnabled });

	async function onUnsubscribe() {
		setMoreOpen(false);
		setError(null);
		if (unsubscribeUrl) {
			openUnsubscribeUrl(unsubscribeUrl);
			return;
		}

		if (!confirmTrashWithoutUnsubscribe()) return;
		setPendingAction("unsubscribe");
		if (!mailboxId) {
			setError("Could not create trash rule");
			setPendingAction(null);
			return;
		}

		try {
			await createTrashSenderRule({ mailboxId, senderAddress });
			await runAction("trash");
		} catch {
			setError("Could not create trash rule");
			setPendingAction(null);
		}
	}

	async function handleForward() {
		if (!message || !messageMeta) return;
		setPendingAction("forward");
		setError(null);
		try {
			const draftId = await createForwardDraft({
				mailboxId,
				ownAddress,
				message: { ...message, ...messageMeta },
				bodyText,
				bodyHtml,
			});
			openDraftComposer(draftId);
		} catch (forwardError) {
			setError(forwardError instanceof Error ? forwardError.message : "Could not start forward");
		} finally {
			setPendingAction(null);
		}
	}
	async function onBlockContact() {
		setMoreOpen(false);
		setError(null);
		if (!mailboxId) {
			setError("Could not block contact");
			return;
		}

		setPendingAction("block");
		try {
			await blockMessageContact({ mailboxId, senderAddress });
			await runSingleMessageAction(messageId, "trash");
			router.push("/trash");
			router.refresh();
		} catch (blockError) {
			setError(blockError instanceof Error ? blockError.message : "Could not block contact");
		} finally {
			setPendingAction(null);
		}
	}

	const disabled = pendingAction !== null;
	const markAction: BulkMessageAction = read ? "unread" : "read";
	const moveActions = getMoveMessageActions(status, direction);

	return (
		<div className="flex items-center gap-1 text-muted-foreground">
			{error && <span className="mr-2 max-w-48 truncate text-xs text-destructive" title={error}>{error}</span>}
			<div className="flex items-center rounded-xl bg-foreground/[0.04] p-0.5 ring-1 ring-inset ring-border/60">
				<Tooltip label="Reply" shortcut={shortcutsEnabled ? "R" : undefined}>
					<button type="button" className={groupButton} aria-label={shortcutsEnabled ? "Reply (r)" : "Reply"} disabled={disabled} onClick={() => handleReply("reply")}>
						<Reply />
						<span className="hidden xl:inline">Reply</span>
					</button>
				</Tooltip>
				{canReplyAll && (
					<Tooltip label="Reply all">
						<button type="button" className={groupButton} aria-label="Reply all" disabled={disabled} onClick={() => handleReply("replyAll")}>
							<ReplyAll />
							<span className="hidden xl:inline">Reply all</span>
						</button>
					</Tooltip>
				)}
				{message && messageMeta && (
					<Tooltip label="Forward">
						<button type="button" className={groupButton} aria-label="Forward" disabled={disabled} onClick={() => void handleForward()}>
							<Forward />
							<span className="hidden xl:inline">Forward</span>
						</button>
					</Tooltip>
				)}
			</div>
			<span className="mx-1.5 h-5 w-px bg-border" />
			<Tooltip label="Archive" shortcut={shortcutsEnabled ? "E" : undefined}>
				<button type="button" className={iconButton} aria-label={shortcutsEnabled ? "Archive (e)" : "Archive"} disabled={disabled || status === "archived"} onClick={() => runAction("archive")}>
					<Archive />
				</button>
			</Tooltip>
			<Tooltip label="Report spam" shortcut={shortcutsEnabled ? "!" : undefined}>
				<button type="button" className={iconButton} aria-label={shortcutsEnabled ? "Report spam (!)" : "Report spam"} disabled={disabled || status === "spam" || direction !== "inbound"} onClick={() => runAction("spam")}>
					<ShieldAlert />
				</button>
			</Tooltip>
			<Tooltip label="Delete" shortcut={shortcutsEnabled ? "#" : undefined}>
				<button type="button" className={cn(iconButton, "hover:bg-destructive/10 hover:text-destructive")} aria-label={shortcutsEnabled ? "Move to trash (#)" : "Move to trash"} disabled={disabled || status === "trash"} onClick={() => runAction("trash")}>
					<Trash2 />
				</button>
			</Tooltip>
			<Tooltip label={read ? "Mark as unread" : "Mark as read"}>
				<button type="button" className={iconButton} aria-label={read ? "Mark as unread" : "Mark as read"} disabled={disabled} onClick={() => runAction(markAction)}>
					{read ? <Mail /> : <MailOpen />}
				</button>
			</Tooltip>
			<DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
				<Tooltip label="More">
					<DropdownMenuTrigger asChild>
						<button type="button" className={iconButton} aria-label="More actions" disabled={disabled}>
							<MoreHorizontal />
						</button>
					</DropdownMenuTrigger>
				</Tooltip>
				<DropdownMenuContent align="end" className="w-56">
					{direction === "inbound" && (
						<>
							<DropdownMenuItem disabled={!unsubscribeUrl && status === "trash"} onSelect={() => void onUnsubscribe()}>
								<BellOff />
								Unsubscribe
							</DropdownMenuItem>
							<DropdownMenuItem destructive onSelect={() => void onBlockContact()}>
								<Ban />
								Block contact
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuLabel>Move to</DropdownMenuLabel>
					{moveActions.map((item) => (
						<DropdownMenuItem key={item.action} onSelect={() => void runAction(item.action)}>
							{createElement(item.icon)}
							{item.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
