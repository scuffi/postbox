import type { ContactDetailsRecord } from "@/components/contacts/contact-details-types";

export type BlockedContactsResponse = {
	contacts?: ContactDetailsRecord[];
	error?: string;
};
