export type BlockContactRequest = {
	mailboxId?: string;
	address?: string;
};

export type UnblockContactRequest = {
	/** Unblocks in the owner's contacts of this mailbox; without it, the signed-in user's own. */
	mailboxId?: string;
	address?: string;
};
