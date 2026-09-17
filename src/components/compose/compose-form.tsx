"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Check, FileText, Forward, Maximize2, Minus, Paperclip, PenLine, Reply, SendHorizontal, Trash2, X } from "lucide-react";
import { toast as showToast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { authFetch } from "@/lib/auth/client";
import { formatEmailAddress, getEmailAddress } from "@/lib/email/address";
import { cn } from "@/lib/utils";
import { buildSendFormData, fetchDraft, formatAttachmentSize } from "./utils";
import { RecipientInput } from "./recipient-input";
import { RichTextEditor } from "./rich-text-editor";
import { ScheduleSendMenu } from "./schedule-send-menu";
import {
	applyMailboxSignatureHtml,
	hasMeaningfulHtml,
	htmlToPlainText,
	joinQuotedHtml,
	splitQuotedHtml,
	textToHtml,
} from "./rich-text-utils";
import { headerToRecipients, isValidRecipient, recipientsToHeader } from "./recipient-utils";
import type { ComposeAttachment, ComposeStoredAttachment, ComposeThreading } from "./types";

type Toast = { type: "success" | "error"; message: string } | null;

export function ComposeForm({
	mode = "page",
	draftIdToLoad,
	onClose,
}: {
	mode?: "page" | "popup";
	draftIdToLoad?: string | null;
	onClose?: () => void;
}) {
	const router = useRouter();
	const { selectedMailbox, setSelectedMailbox, mailboxes } = useSelectedMailbox();
	const [draftId, setDraftId] = useState<string | null>(null);
	const [to, setTo] = useState<string[]>([]);
	const [cc, setCc] = useState<string[]>([]);
	const [bcc, setBcc] = useState<string[]>([]);
	const [showCc, setShowCc] = useState(false);
	const [showBcc, setShowBcc] = useState(false);
	const [threading, setThreading] = useState<ComposeThreading | null>(null);
	const [subject, setSubject] = useState("");
	// The body is HTML; quoted/forwarded content is kept aside and folded.
	const [html, setHtml] = useState("");
	const [quotedHtml, setQuotedHtml] = useState<string | null>(null);
	const [attachments, setAttachments] = useState<ComposeAttachment[]>([]);
	// Attachments the draft already holds server-side (a forwarded message's files).
	const [storedAttachments, setStoredAttachments] = useState<ComposeStoredAttachment[]>([]);
	const [toast, setToast] = useState<Toast>(null);
	const [loading, setLoading] = useState(false);
	const [loadingDraft, setLoadingDraft] = useState(false);
	const [deletingDraft, setDeletingDraft] = useState(false);
	const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
	const [loadedDraftMailboxId, setLoadedDraftMailboxId] = useState<string | null>(null);
	const [loadedDraftFrom, setLoadedDraftFrom] = useState<string | null>(null);
	const [selectedFrom, setSelectedFrom] = useState("");
	const [fallbackMailboxId, setFallbackMailboxId] = useState<string | null>(null);
	const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const draftGeneration = useRef(0);
	const attachmentInput = useRef<HTMLInputElement | null>(null);
	const previousSignature = useRef("");
	const [minimized, setMinimized] = useState(false);

	// Surface form feedback through the app-wide toaster.
	useEffect(() => {
		if (!toast) return;
		if (toast.type === "success") showToast.success(toast.message);
		else showToast.error(toast.message);
	}, [toast]);

	useEffect(() => {
		if (!selectedMailbox && mailboxes.length === 1) setSelectedMailbox(mailboxes[0]);
	}, [mailboxes, selectedMailbox, setSelectedMailbox]);

	// When the unified inbox is selected, composing still needs a concrete
	// "from" mailbox. Fall back to the primary (or first) mailbox without
	// changing the global selection, so the inbox stays in the unified view.
	const primaryMailbox = mailboxes.find((mailbox) => mailbox.isPrimary) ?? mailboxes[0] ?? null;
	const effectiveMailbox = selectedMailbox ?? mailboxes.find((mailbox) => mailbox.id === fallbackMailboxId) ?? primaryMailbox;

	const senderAddresses = useMemo(() => {
		if (!effectiveMailbox) return [];
		return effectiveMailbox.senderAddresses?.length
			? effectiveMailbox.senderAddresses
			: [`${effectiveMailbox.localPart}@${effectiveMailbox.hostname}`];
	}, [effectiveMailbox]);
	const senderOptions = useMemo(
		() => mailboxes.flatMap((mailbox) => {
			const addresses = mailbox.senderAddresses?.length
				? mailbox.senderAddresses
				: [`${mailbox.localPart}@${mailbox.hostname}`];
			return addresses.map((address) => ({ mailbox, address }));
		}),
		[mailboxes],
	);
	const fromAddr = effectiveMailbox && selectedFrom
		? formatEmailAddress(selectedFrom, effectiveMailbox.displayName)
		: "";

	useEffect(() => {
		if (!senderAddresses.length) {
			setSelectedFrom("");
			return;
		}
		if (!senderAddresses.includes(selectedFrom)) setSelectedFrom(senderAddresses[0]);
	}, [selectedFrom, senderAddresses]);

	useEffect(() => {
		if (!toast) return;
		const timer = setTimeout(() => setToast(null), 3200);
		return () => clearTimeout(timer);
	}, [toast]);

	useEffect(() => {
		if (!draftIdToLoad) return;

		let cancelled = false;
		setLoadingDraft(true);
		fetchDraft(draftIdToLoad)
			.then((draft) => {
				if (cancelled) return;

				setDraftId(draft.id);
				setTo(headerToRecipients(draft.toAddr));
				const draftCc = headerToRecipients(draft.ccAddr);
				const draftBcc = headerToRecipients(draft.bccAddr);
				setCc(draftCc);
				setBcc(draftBcc);
				setShowCc(draftCc.length > 0);
				setShowBcc(draftBcc.length > 0);
				setThreading(
					draft.inReplyTo || draft.threadId
						? {
								inReplyTo: draft.inReplyTo ?? null,
								references: draft.references ?? null,
								threadId: draft.threadId ?? null,
							}
						: null,
				);
				setSubject(draft.subject ?? "");
				const stored = splitQuotedHtml(draft.htmlBody || textToHtml(draft.textBody));
				setHtml(stored.body);
				setQuotedHtml(stored.quoted);
				setStoredAttachments(draft.attachments?.filter((item) => item.disposition === "attachment") ?? []);
				setLoadedDraftMailboxId(draft.mailboxId);
				setLoadedDraftFrom(getEmailAddress(draft.fromAddr).toLowerCase());
			})
			.catch((err) => {
				if (cancelled) return;
				const message = err instanceof Error ? err.message : "Failed to load draft";
				setToast({ type: "error", message });
			})
			.finally(() => {
				if (!cancelled) setLoadingDraft(false);
			});

		return () => {
			cancelled = true;
		};
	}, [draftIdToLoad]);

	useEffect(() => {
		if (!loadedDraftMailboxId) return;
		if (selectedMailbox?.id === loadedDraftMailboxId) return;

		const draftMailbox = mailboxes.find((mailbox) => mailbox.id === loadedDraftMailboxId);
		if (draftMailbox) setSelectedMailbox(draftMailbox);
	}, [loadedDraftMailboxId, mailboxes, selectedMailbox?.id, setSelectedMailbox]);

	useEffect(() => {
		if (!loadedDraftFrom || !senderAddresses.includes(loadedDraftFrom)) return;
		setSelectedFrom(loadedDraftFrom);
	}, [loadedDraftFrom, senderAddresses]);

	useEffect(() => {
		if (loadingDraft) return;
		const nextSignature = effectiveMailbox?.signature ?? "";
		setHtml((current) => applyMailboxSignatureHtml(current, previousSignature.current, nextSignature));
		previousSignature.current = nextSignature;
	}, [loadingDraft, effectiveMailbox?.id, effectiveMailbox?.signature]);

	useEffect(() => {
		const bodyContent = htmlToPlainText(html).trim();
		const signatureOnly = bodyContent === (effectiveMailbox?.signature?.trim() ?? "");
		const hasContent =
			to.length > 0 || cc.length > 0 || bcc.length > 0 || subject.trim() || quotedHtml || (bodyContent && !signatureOnly);
		if (!fromAddr || !hasContent || loadingDraft) return;
		if (saveTimer.current) clearTimeout(saveTimer.current);

		const generation = draftGeneration.current;
		saveTimer.current = setTimeout(async () => {
			const payload = {
				mailboxId: effectiveMailbox?.id,
				from: fromAddr,
				to: recipientsToHeader(to),
				cc: recipientsToHeader(cc),
				bcc: recipientsToHeader(bcc),
				subject,
				html: joinQuotedHtml(html, quotedHtml),
				text: htmlToPlainText(joinQuotedHtml(html, quotedHtml)),
				inReplyTo: threading?.inReplyTo ?? null,
				references: threading?.references ?? null,
				threadId: threading?.threadId ?? null,
			};
			const res = await authFetch(draftId ? `/api/drafts/${draftId}` : "/api/drafts", {
				method: draftId ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = (await res.json()) as { draft?: { id: string } };
			if (res.ok && data.draft?.id) {
				if (generation !== draftGeneration.current) {
					void authFetch(`/api/drafts/${data.draft.id}`, { method: "DELETE" });
					return;
				}
				setDraftId(data.draft.id);
			}
		}, 900);

		return () => {
			if (saveTimer.current) clearTimeout(saveTimer.current);
		};
	}, [bcc, cc, draftId, fromAddr, html, loadingDraft, quotedHtml, effectiveMailbox?.id, effectiveMailbox?.signature, subject, threading, to]);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (to.length === 0) {
			setToast({ type: "error", message: "Add at least one recipient" });
			return;
		}
		const invalid = [...to, ...cc, ...bcc].find((entry) => !isValidRecipient(entry));
		if (invalid) {
			setToast({ type: "error", message: `"${invalid}" is not a valid email address` });
			return;
		}
		if (!hasMeaningfulHtml(html) && !quotedHtml) {
			setToast({ type: "error", message: "Write a message before sending" });
			return;
		}
		setLoading(true);
		const fullHtml = joinQuotedHtml(html, quotedHtml);
		const res = await authFetch("/api/send", {
			method: "POST",
			body: buildSendFormData({
				attachments,
				from: fromAddr,
				to: recipientsToHeader(to),
				cc: recipientsToHeader(cc),
				bcc: recipientsToHeader(bcc),
				subject,
				text: htmlToPlainText(fullHtml),
				html: fullHtml,
				mailboxId: effectiveMailbox?.id,
				threading: threading ?? undefined,
				draftId: storedAttachments.length > 0 ? draftId : null,
				scheduledAt,
			}),
		});
		const data = (await res.json()) as { messageId?: string; scheduled?: boolean; error?: string };
		setLoading(false);

		if (!res.ok) {
			setToast({ type: "error", message: data.error ?? "Send failed" });
			return;
		}

		if (draftId) {
			void authFetch(`/api/drafts/${draftId}`, { method: "DELETE" }).finally(() => {
				window.dispatchEvent(new Event("mailflare:messages-changed"));
			});
		}
		setDraftId(null);
		setTo([]);
		setCc([]);
		setBcc([]);
		setShowCc(false);
		setShowBcc(false);
		setThreading(null);
		setStoredAttachments([]);
		setSubject("");
		setHtml(applyMailboxSignatureHtml("", "", effectiveMailbox?.signature));
		setQuotedHtml(null);
		setAttachments([]);
		setScheduledAt(null);
		setToast({ type: "success", message: data.scheduled ? "Message scheduled" : "Message sent" });
		window.dispatchEvent(new Event("mailflare:messages-changed"));
	}

	async function deleteDraftAndClose() {
		if (saveTimer.current) clearTimeout(saveTimer.current);
		draftGeneration.current += 1;
		setDeletingDraft(true);

		if (draftId) {
			const res = await authFetch(`/api/drafts/${draftId}`, { method: "DELETE" });
			if (!res.ok) {
				setDeletingDraft(false);
				setToast({ type: "error", message: "Could not delete draft" });
				return;
			}
		}

		setDraftId(null);
		setTo([]);
		setCc([]);
		setBcc([]);
		setShowCc(false);
		setShowBcc(false);
		setThreading(null);
		setStoredAttachments([]);
		setSubject("");
		setHtml(applyMailboxSignatureHtml("", "", effectiveMailbox?.signature));
		setQuotedHtml(null);
		setAttachments([]);
		setScheduledAt(null);
		window.dispatchEvent(new Event("mailflare:messages-changed"));

		if (onClose) {
			onClose();
			return;
		}
		setDeletingDraft(false);
		router.push("/inbox");
	}

	async function removeStoredAttachment(attachmentId: string) {
		if (!draftId) return;
		const res = await authFetch(`/api/drafts/${draftId}/attachments/${attachmentId}`, { method: "DELETE" });
		if (!res.ok) {
			setToast({ type: "error", message: "Could not remove attachment" });
			return;
		}
		setStoredAttachments((current) => current.filter((item) => item.id !== attachmentId));
	}

	function addAttachments(files: FileList | null) {
		if (!files) return;
		const nextFiles = Array.from(files);
		const nextCount = storedAttachments.length + attachments.length + nextFiles.length;
		const totalSize =
			storedAttachments.reduce((total, item) => total + item.size, 0) +
			[...attachments.map((attachment) => attachment.file), ...nextFiles].reduce(
				(total, file) => total + file.size,
				0,
			);

		if (nextCount > 10) {
			setToast({ type: "error", message: "A message can include at most 10 attachments" });
			return;
		}
		if (nextFiles.some((file) => file.size > 10 * 1024 * 1024)) {
			setToast({ type: "error", message: "Each attachment must be 10 MB or smaller" });
			return;
		}
		if (totalSize > 20 * 1024 * 1024) {
			setToast({ type: "error", message: "Attachments must total 20 MB or less" });
			return;
		}

		setAttachments((current) => [
			...current,
			...nextFiles.map((file) => ({ id: crypto.randomUUID(), file })),
		]);
		if (attachmentInput.current) attachmentInput.current.value = "";
	}

	function selectSender(value: string) {
		const option = senderOptions.find((item) => `${item.mailbox.id}|${item.address}` === value);
		if (!option) return;
		setSelectedFrom(option.address);
		if (selectedMailbox) setSelectedMailbox(option.mailbox);
		else setFallbackMailboxId(option.mailbox.id);
	}

	const composerTitle = loadingDraft
		? "Loading draft…"
		: threading?.inReplyTo
			? "Reply"
			: /^fwd?:/i.test(subject)
				? "Forward"
				: subject.trim() || "New message";
	const TitleIcon = threading?.inReplyTo ? Reply : /^fwd?:/i.test(subject) ? Forward : PenLine;

	const frameClass =
		mode === "popup"
			? cn(
				"flex flex-col overflow-hidden bg-popover shadow-float transition-[width,height,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:rounded-2xl",
				minimized
					? "h-12 w-[min(340px,100vw)] rounded-t-2xl"
					: "h-dvh w-full pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] max-sm:rounded-none sm:h-[min(600px,calc(100dvh-88px))] sm:w-[min(620px,calc(100vw-32px))] sm:rounded-2xl sm:p-0",
			)
			: "flex h-full min-h-[680px] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-panel";

	const chipClass =
		"group/chip flex max-w-full items-center gap-2 rounded-lg bg-muted py-1 pl-1 pr-1.5 text-[13px] ring-1 ring-inset ring-border";

	return (
		<form
			onSubmit={onSubmit}
			onKeyDown={(event) => {
				if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
					event.preventDefault();
					event.currentTarget.requestSubmit();
				}
			}}
			className={frameClass}
		>
			<div
				className={cn(
					"flex h-12 shrink-0 items-center gap-2 border-b border-border pl-4 pr-2",
					mode === "popup" && minimized && "cursor-pointer border-b-0",
				)}
				onClick={mode === "popup" && minimized ? () => setMinimized(false) : undefined}
			>
				<span className="flex size-6 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
					<TitleIcon className="size-3.5" />
				</span>
				<span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold tracking-[-0.01em] text-foreground">
					{composerTitle}
				</span>
				{draftId && !loadingDraft && (
					<span className="hidden items-center gap-1 text-[11.5px] text-subtle-foreground sm:flex">
						<Check className="size-3" />
						Saved
					</span>
				)}
				{mode === "popup" && (
					<div className="flex items-center">
						<Tooltip label={minimized ? "Expand" : "Minimise"}>
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									setMinimized((value) => !value);
								}}
								className="hidden size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:flex"
								aria-label={minimized ? "Expand composer" : "Minimise composer"}
							>
								{minimized ? <Maximize2 className="size-3.5" /> : <Minus className="size-4" />}
							</button>
						</Tooltip>
						<Tooltip label="Close" shortcut="Esc">
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									onClose?.();
								}}
								className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
								aria-label="Close composer"
							>
								<X className="size-4" />
							</button>
						</Tooltip>
					</div>
				)}
			</div>
			<div className={cn("flex min-h-0 flex-1 flex-col", mode === "popup" && minimized && "hidden")}>
				<div className="flex h-11 items-center gap-2 border-b border-border px-4">
					<Label htmlFor={`${mode}-from`} className="w-9 shrink-0 text-[13px] font-normal text-subtle-foreground">From</Label>
					<Select
						id={`${mode}-from`}
						value={effectiveMailbox && selectedFrom ? `${effectiveMailbox.id}|${selectedFrom}` : ""}
						onChange={(event) => selectSender(event.target.value)}
						required
						disabled={loadingDraft || senderOptions.length === 0}
						className="h-8 border-0 bg-transparent pl-0 text-[13.5px] font-medium shadow-none hover:border-0 focus-visible:ring-0 dark:bg-transparent"
						containerClassName="flex-1"
					>
						{senderOptions.length === 0 && <option value="">Select a mailbox first</option>}
						{senderOptions.map(({ mailbox, address }) => (
							<option key={`${mailbox.id}|${address}`} value={`${mailbox.id}|${address}`}>{address}</option>
						))}
					</Select>
				</div>
				<RecipientInput
					id={`${mode}-to`}
					label="To"
					value={to}
					onChange={setTo}
					placeholder='Recipients, or "Maya Chen" <maya@example.com>'
					required
					disabled={loadingDraft}
					trailing={
						<>
							{!showCc && (
								<button type="button" className="rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-accent hover:text-foreground" onClick={() => setShowCc(true)}>
									Cc
								</button>
							)}
							{!showBcc && (
								<button type="button" className="rounded-md px-1.5 py-0.5 font-medium transition-colors hover:bg-accent hover:text-foreground" onClick={() => setShowBcc(true)}>
									Bcc
								</button>
							)}
						</>
					}
				/>
				{showCc && (
					<RecipientInput
						id={`${mode}-cc`}
						label="Cc"
						value={cc}
						onChange={setCc}
						placeholder="Carbon copy"
						disabled={loadingDraft}
						autoFocus={!loadingDraft && cc.length === 0}
					/>
				)}
				{showBcc && (
					<RecipientInput
						id={`${mode}-bcc`}
						label="Bcc"
						value={bcc}
						onChange={setBcc}
						placeholder="Blind carbon copy, hidden from other recipients"
						disabled={loadingDraft}
						autoFocus={!loadingDraft && bcc.length === 0}
					/>
				)}
				<div className="border-b border-border px-4">
					<Label htmlFor={`${mode}-subject`} className="sr-only">Subject</Label>
					<input
						id={`${mode}-subject`}
						value={subject}
						onChange={(event) => setSubject(event.target.value)}
						placeholder="Subject"
						required
						disabled={loadingDraft}
						className="h-12 w-full bg-transparent text-[15px] font-semibold tracking-[-0.01em] text-foreground outline-none placeholder:font-medium placeholder:text-subtle-foreground disabled:opacity-50"
					/>
				</div>
				<Label htmlFor={`${mode}-text`} className="sr-only">Body</Label>
				<RichTextEditor
					id={`${mode}-text`}
					value={html}
					onChange={setHtml}
					quotedHtml={quotedHtml}
					disabled={loadingDraft}
					placeholder="Write your message…"
					toolbarStart={
						<div className="mr-2 flex items-center rounded-xl shadow-button">
							<Tooltip label={scheduledAt ? "Schedule send" : "Send"} shortcut="⌘↵">
								<button
									type="submit"
									disabled={loading || loadingDraft || !fromAddr}
									className="flex h-8 items-center gap-1.5 rounded-l-xl bg-gradient-to-b from-[color-mix(in_oklab,var(--primary)_90%,white)] to-primary pl-3.5 pr-3 text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-[1.06] disabled:pointer-events-none disabled:opacity-50"
								>
									{scheduledAt ? <CalendarClock className="size-3.5" /> : <SendHorizontal className="size-3.5" />}
									{loading ? "Sending…" : scheduledAt ? "Schedule" : "Send"}
								</button>
							</Tooltip>
							<ScheduleSendMenu
								disabled={loading || loadingDraft || !fromAddr}
								value={scheduledAt}
								onChange={setScheduledAt}
							/>
						</div>
					}
					toolbarEnd={
						<>
							<input
								ref={attachmentInput}
								type="file"
								multiple
								className="hidden"
								onChange={(event) => addAttachments(event.target.files)}
							/>
							<Tooltip label="Attach files">
								<button
									type="button"
									aria-label="Attach files"
									onClick={() => attachmentInput.current?.click()}
									disabled={loading || loadingDraft}
									className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
								>
									<Paperclip className="size-4" />
								</button>
							</Tooltip>
							<span className="flex-1" />
							<Tooltip label="Discard draft">
								<button
									type="button"
									aria-label="Delete draft"
									onClick={() => void deleteDraftAndClose()}
									disabled={loading || loadingDraft || deletingDraft}
									className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
								>
									<Trash2 className="size-4" />
								</button>
							</Tooltip>
						</>
					}
				/>
				{(attachments.length > 0 || storedAttachments.length > 0) && (
					<div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto border-t border-border px-4 py-3">
						{storedAttachments.map((attachment) => (
							<div key={attachment.id} className={chipClass} title="Carried over from the forwarded message">
								<span className="flex size-6 items-center justify-center rounded-md bg-card text-muted-foreground ring-1 ring-inset ring-border">
									<FileText className="size-3.5" />
								</span>
								<span className="max-w-44 truncate font-medium text-foreground">{attachment.filename}</span>
								<span className="text-xs tabular-nums text-subtle-foreground">{formatAttachmentSize(attachment.size)}</span>
								<button
									type="button"
									onClick={() => void removeStoredAttachment(attachment.id)}
									className="flex size-5 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
								>
									<X className="size-3.5" />
									<span className="sr-only">Remove attachment</span>
								</button>
							</div>
						))}
						{attachments.map((attachment) => (
							<div key={attachment.id} className={chipClass}>
								<span className="flex size-6 items-center justify-center rounded-md bg-card text-muted-foreground ring-1 ring-inset ring-border">
									<FileText className="size-3.5" />
								</span>
								<span className="max-w-44 truncate font-medium text-foreground">{attachment.file.name}</span>
								<span className="text-xs tabular-nums text-subtle-foreground">
									{formatAttachmentSize(attachment.file.size)}
								</span>
								<button
									type="button"
									onClick={() =>
										setAttachments((current) =>
											current.filter((item) => item.id !== attachment.id),
										)
									}
									className="flex size-5 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
								>
									<X className="size-3.5" />
									<span className="sr-only">Remove attachment</span>
								</button>
							</div>
						))}
					</div>
				)}
			</div>
		</form>
	);
}
