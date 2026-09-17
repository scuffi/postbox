import type { ReactNode } from "react";
import type { ThreadMessage } from "@/hooks/types";

export type ConversationThreadProps = {
	/** The message the reader opened; its full card is passed in as `current`. */
	currentMessageId: string;
	/** The open message's card, rendered in its place in the conversation. */
	current: ReactNode;
	messages: ThreadMessage[];
	mailboxId: string | null;
	currentAccountName?: string;
	ownAddress?: string | null;
	ownAddresses?: string[];
	latestMessagesFirst: boolean;
	onLatestMessagesFirstChange: (latestFirst: boolean) => void;
	expandedAll: boolean;
	onExpandedAllChange: (expanded: boolean) => void;
};

export type ConversationMessageCardProps = {
	message: ThreadMessage;
	mailboxId: string | null;
	currentAccountName?: string;
	ownAddress?: string | null;
	ownAddresses?: string[];
	defaultExpanded?: boolean;
};

export type UseMessageThreadResult = {
	messages: ThreadMessage[];
	loading: boolean;
};
