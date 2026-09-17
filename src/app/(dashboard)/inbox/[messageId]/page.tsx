"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Cloud, ExternalLink, MailX, MessagesSquare, MoreHorizontal, Paperclip } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Tooltip } from "@/components/ui/tooltip";
import { domainColor } from "@/lib/domain-color";
import { cn } from "@/lib/utils";
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks/use-media-query";
import dayjs from "dayjs";
import { MarkAsRead } from "@/components/mark-read";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { ContactDetailsTrigger } from "@/components/contacts/contact-details";
import { ContactAvatar } from "@/components/contacts/contact-avatar";
import { MessageActions } from "@/components/message-actions/message-actions";
import { MessageAttachmentViewer } from "@/components/message-attachment-viewer";
import { MessageAttachmentCard } from "@/components/message-attachment-card";
import { MessageDetailSkeleton } from "@/components/page-skeletons";
import { usePageLoading } from "@/components/page-loading";
import { PreviousMessage } from "@/components/previous-message";
import { ConversationThread } from "@/components/messages/conversation-thread";
import { formatThreadTime, formatThreadTimestampFull } from "@/components/messages/conversation-thread-utils";
import { ThreadMessageActions } from "@/components/messages/thread-message-actions";
import { SpamScoreDetails } from "@/components/messages/spam-score-details";
import { SenderAlerts, SenderVerificationBadge } from "@/components/messages/sender-verification";
import { useMessageThread } from "@/components/messages/use-message-thread";
import { useLatestMessagesFirst } from "@/components/messages/use-latest-messages-first";
import { getMessageBackHref } from "@/components/message-actions/utils";
import { getEmailAddress, getEmailDisplayName, splitEmailAddressList } from "@/lib/email/address";
import type { MessageAttachment, MessageDetailResponse } from "./types";
import {
  fetchMessageDetail,
  fetchMessageMetadata,
  getCachedMessageDetailForDisplay,
  getMessageBodyDisplay,
  getMessageHeaderParties,
  getOwnAddressForMessage,
  resolveInlineAttachmentUrls,
} from "./utils";
import { extractCloudAttachments } from "./cloud-attachment-utils";
import { sanitizeEmailHtml } from "./email-html-sanitizer";

export default function MessageDetailPage() {
  const params = useParams<{ messageId: string }>();
  const { selectedMailbox, mailboxes } = useSelectedMailbox();
  const messageId = params.messageId;
  const [data, setData] = useState<MessageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewAttachment, setPreviewAttachment] =
    useState<MessageAttachment | null>(null);
  const [threadExpanded, setThreadExpanded] = useState(false);
  const [latestMessagesFirst, setLatestMessagesFirst] = useLatestMessagesFirst();
  const desktop = useMediaQuery(DESKTOP_QUERY, true);
  usePageLoading(loading);
  const thread = useMessageThread(messageId, data?.message?.threadId);

  useEffect(() => {
    let cancelled = false;

    async function loadMessage() {
      const cachedData = getCachedMessageDetailForDisplay(messageId);
      if (cachedData?.message && cachedData.body) {
        setData(cachedData);
        setLoading(false);
        if (cachedData.attachments !== undefined) return;
        try {
          const metadata = await fetchMessageMetadata(messageId);
          if (!cancelled) setData((current) => current ? { ...current, ...metadata } : current);
        } catch {
          // The message body remains usable if supplemental metadata is unavailable.
        }
        return;
      }
      setLoading(true);
      const nextData = await fetchMessageDetail(messageId);
      if (!cancelled) {
        setData(nextData);
        setLoading(false);
      }
    }

    void loadMessage();
    return () => {
      cancelled = true;
    };
  }, [messageId]);

  useEffect(() => {
    setThreadExpanded(false);
  }, [messageId]);

  if (loading) {
    return <MessageDetailSkeleton />;
  }

  if (!data?.message) {
    return (
      <EmptyState
        icon={MailX}
        title="Message not found"
        description={data?.error ?? "It may have been moved or deleted."}
        className="h-full"
        action={
          <Link href="/inbox" className="text-sm font-medium text-primary hover:underline">
            Back to inbox
          </Link>
        }
      />
    );
  }

  const { message, body, attachments = [] } = data;
  const currentThreadMessage = {
    ...message,
    textBody: body?.textBody ?? null,
    htmlBody: body?.htmlBody ?? null,
    attachments,
  };
  const messageMailbox =
    mailboxes.find((mailbox) => mailbox.id === message.mailboxId) ?? selectedMailbox;
  const currentAccountName =
    messageMailbox?.displayName ?? messageMailbox?.localPart;
  const { fromName, fromAddress, toName } = getMessageHeaderParties(
    message,
    currentAccountName,
  );
  const ownAddresses = messageMailbox
    ? messageMailbox.senderAddresses?.length
      ? messageMailbox.senderAddresses
      : [`${messageMailbox.localPart}@${messageMailbox.hostname}`]
    : [];
  const ownAddress = getOwnAddressForMessage(message, ownAddresses);
  const toEntries = splitEmailAddressList(message.toAddr);
  const ccEntries = splitEmailAddressList(message.ccAddr);
  const bccEntries = splitEmailAddressList(message.bccAddr);
  const bodyDisplay = getMessageBodyDisplay(
    body?.textBody,
    body?.htmlBody,
    message.snippet,
    ownAddress,
  );
  const htmlBody = sanitizeEmailHtml(
    resolveInlineAttachmentUrls(bodyDisplay.htmlBody, message.id, attachments),
  );
  const quotedHtml = sanitizeEmailHtml(
    resolveInlineAttachmentUrls(bodyDisplay.quotedHtml, message.id, attachments),
  );
  const cloudAttachmentResult = extractCloudAttachments(
    bodyDisplay.latestContent,
  );
  const mailboxDomain = messageMailbox?.hostname ?? "";
  const threadCount = thread.messages.length;
  const actions = (
    <MessageActions
      messageId={message.id}
      mailboxId={message.mailboxId}
      senderAddress={message.fromAddr}
      direction={message.direction}
      status={message.status}
      read={message.read}
      unsubscribeUrl={data.unsubscribeUrl}
      subject={message.subject}
      bodyText={body?.textBody}
      ownAddress={ownAddress}
      ownAddresses={ownAddresses}
      message={message}
      messageMeta={message}
      bodyHtml={body?.htmlBody}
      variant={desktop ? "toolbar" : "bar"}
    />
  );
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-gutter-stable">
        {!message.read && <MarkAsRead messageId={message.id} />}
        <div className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-card/80 px-2 backdrop-blur-xl backdrop-saturate-150 sm:px-4 lg:h-14">
          <Link
            href={getMessageBackHref(message.direction, message.status)}
            className="flex h-9 items-center gap-0.5 rounded-lg pl-1 pr-2.5 text-[15px] font-medium text-primary transition-[background-color,transform] hover:bg-accent active:scale-95 lg:hidden"
            aria-label="Back to list"
          >
            <ChevronLeft className="size-5" strokeWidth={2.2} />
            Back
          </Link>
          <div className="flex-1" />
          {desktop && actions}
        </div>

        <div className="mx-auto w-full max-w-[860px] px-4 pb-10 pt-5 sm:px-8 sm:pb-16 sm:pt-8">
          <header className="animate-fade-up">
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {messageMailbox && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[11.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
                  <span className={cn("size-1.5 rounded-full", domainColor(mailboxDomain).dot)} />
                  {messageMailbox.displayName ?? messageMailbox.localPart}
                  <span className="text-subtle-foreground">@{mailboxDomain}</span>
                </span>
              )}
              {threadCount > 1 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-foreground/[0.04] px-1.5 py-0.5 text-[11.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
                  <MessagesSquare className="size-3" />
                  {threadCount} in conversation
                </span>
              )}
              <SpamScoreDetails
                score={message.spamScore}
                verdict={message.spamVerdict}
                signals={message.spamSignals}
                analysisError={message.spamAnalysisError}
              />
            </div>
            <h1 className="text-balance text-[22px] font-semibold leading-[1.2] tracking-[-0.022em] text-foreground sm:text-[26px]">
              {message.subject ?? "(no subject)"}
            </h1>
          </header>

          <ConversationThread
            currentMessageId={message.id}
            messages={thread.messages}
            mailboxId={message.mailboxId}
            currentAccountName={currentAccountName}
            ownAddress={ownAddress}
            ownAddresses={ownAddresses}
            latestMessagesFirst={latestMessagesFirst}
            onLatestMessagesFirstChange={setLatestMessagesFirst}
            expandedAll={threadExpanded}
            onExpandedAllChange={setThreadExpanded}
            current={
          <article className="animate-fade-up rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
            <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-4 sm:gap-4 sm:px-6 sm:pt-5">
              <div className="flex min-w-0 items-start gap-3">
                <ContactAvatar
                  mailboxId={message.mailboxId}
                  address={message.fromAddr}
                  name={fromName}
                  className="size-10 text-sm"
                  hasManagedAvatar={message.direction === "inbound"}
                  managedAvatarUrl={message.direction === "outbound" && message.mailboxId
                    ? `/api/mailboxes/${message.mailboxId}/avatar`
                    : undefined}
                />
                <div className="min-w-0 pt-0.5">
                  <p className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 text-sm">
                    <span className="font-semibold text-foreground">
                      {message.direction === "inbound" ? (
                        <ContactDetailsTrigger
                          mailboxId={message.mailboxId}
                          address={message.fromAddr}
                          name={fromName}
                        />
                      ) : (
                        fromName
                      )}
                    </span>
                    <SenderVerificationBadge verification={data.senderVerification} className="self-center" />
                    <span className="truncate text-[13px] text-muted-foreground">{fromAddress}</span>
                  </p>
                  <div className="mt-0.5 space-y-0.5 text-[12.5px] text-muted-foreground">
                    <p>
                      <span className="text-subtle-foreground">To </span>
                      {message.direction === "inbound" && toEntries.length <= 1 ? (
                        toName
                      ) : (
                        <RecipientList
                          entries={toEntries}
                          mailboxId={message.mailboxId}
                          firstName={message.direction === "outbound" ? toName : undefined}
                        />
                      )}
                    </p>
                    {ccEntries.length > 0 && (
                      <p>
                        <span className="text-subtle-foreground">Cc </span>
                        <RecipientList entries={ccEntries} mailboxId={message.mailboxId} />
                      </p>
                    )}
                    {bccEntries.length > 0 && (
                      <p>
                        <span className="text-subtle-foreground">Bcc </span>
                        <RecipientList entries={bccEntries} mailboxId={message.mailboxId} />
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Tooltip label={formatThreadTimestampFull(message.createdAt)}>
                  <time dateTime={message.createdAt} className="hidden text-xs tabular-nums text-subtle-foreground sm:block">
                    {formatThreadTime(message.createdAt)}
                  </time>
                </Tooltip>
                <ThreadMessageActions
                  message={currentThreadMessage}
                  mailboxId={message.mailboxId}
                  ownAddress={ownAddress}
                  ownAddresses={ownAddresses}
                />
              </div>
            </div>

            <div className="px-4 pb-6 sm:px-6">
              <SenderAlerts verification={data.senderVerification} className="mb-4" />
              {htmlBody ? (
                <div className="email-paper">
                  <div className="email-body text-foreground" dangerouslySetInnerHTML={{ __html: htmlBody }} />
                </div>
              ) : (
                <pre className="text whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {cloudAttachmentResult.content}
                </pre>
              )}
              {quotedHtml && (
                <details className="group mt-4">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:text-foreground">
                    <MoreHorizontal className="size-3.5" />
                    <span className="group-open:hidden">Show quoted text</span>
                    <span className="hidden group-open:inline">Hide quoted text</span>
                  </summary>
                  <div className="email-paper mt-3 border-l-2 border-border-strong pl-4">
                    <div
                      className="email-body max-w-none pb-2 text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: quotedHtml }}
                    />
                  </div>
                </details>
              )}
              {bodyDisplay.quotedContent.map((quotedContent) => (
                <PreviousMessage
                  key={`${quotedContent.dateLine}-${quotedContent.content.slice(0, 24)}`}
                  message={quotedContent}
                />
              ))}

              {cloudAttachmentResult.attachments.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
                    <Cloud className="size-3.5" />
                    Cloud files · {cloudAttachmentResult.attachments.length}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {cloudAttachmentResult.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-all hover:-translate-y-px hover:border-border-strong hover:shadow-panel"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                          <Cloud className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-foreground">
                            {attachment.filename}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Open in {attachment.provider}
                          </span>
                        </span>
                        <ExternalLink className="size-4 shrink-0 text-subtle-foreground transition-colors group-hover:text-foreground" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
              {attachments.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
                    <Paperclip className="size-3.5" />
                    Attachments · {attachments.length}
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {attachments.map((attachment) => (
                      <MessageAttachmentCard
                        key={attachment.id}
                        attachment={attachment}
                        messageId={message.id}
                        onPreview={setPreviewAttachment}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>
            }
          />
        </div>
        <MessageAttachmentViewer
          attachment={previewAttachment}
          messageId={message.id}
          open={previewAttachment !== null}
          onOpenChange={(open) => {
            if (!open) setPreviewAttachment(null);
          }}
        />
      </div>
      {!desktop && actions}
    </div>
  );
}

function RecipientList({
  entries,
  mailboxId,
  firstName,
}: {
  entries: string[];
  mailboxId: string | null;
  /** A contact name already resolved for the first entry, when the caller has one. */
  firstName?: string;
}) {
  if (entries.length === 0) return <>—</>;
  return (
    <>
      {entries.map((entry, index) => (
        <span key={entry} title={getEmailAddress(entry)}>
          {index > 0 && ", "}
          <ContactDetailsTrigger
            mailboxId={mailboxId}
            address={entry}
            name={index === 0 && firstName ? firstName : getEmailDisplayName(entry)}
          />
        </span>
      ))}
    </>
  );
}
