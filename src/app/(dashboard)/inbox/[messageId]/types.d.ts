import type { Message } from "@/hooks/types";
import type { ReplyContentParts } from "@/lib/email/reply-content-types";
import type { SenderVerification } from "@/lib/email/sender-verification-types";

export type MessageDetailResponse = {
	message?: Message;
	body?: {
		htmlBody: string | null;
		textBody: string | null;
	} | null;
	attachments?: MessageAttachment[];
	unsubscribeUrl?: string | null;
	/** Inbound only: whether the From domain vouched for the message, plus impersonation warnings. */
	senderVerification?: SenderVerification | null;
	error?: string;
};

export type MessageAttachment = {
	contentId: string | null;
	disposition: "attachment" | "inline";
	filename: string;
	id: string;
	messageId: string;
	size: number;
	type: string;
};

export type MessageBodyDisplay = ReplyContentParts & {
	htmlBody: string | null;
	/** Quoted/forwarded HTML a Mailflare composer folded under the message, shown collapsed. */
	quotedHtml: string | null;
	hasQuotedContent: boolean;
};
