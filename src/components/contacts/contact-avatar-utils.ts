import { getEmailAddress } from "@/lib/email/address";

export function getManagedContactAvatarUrl(mailboxId: string, address: string, version = 0): string {
	const params = new URLSearchParams({ mailboxId, address: getEmailAddress(address) });
	if (version) params.set("v", String(version));
	return `/api/contacts/avatar?${params.toString()}`;
}

export function getContactAvatarInitial(name: string, address: string): string {
	return (name.trim() || getEmailAddress(address)).slice(0, 1).toUpperCase();
}

const AVATAR_TINTS = [
	"bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
	"bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
	"bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
	"bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
	"bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
	"bg-stone-200 text-stone-700 dark:bg-stone-500/20 dark:text-stone-300",
	"bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
	"bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
];

/** A soft, stable colour for initials so senders are recognisable at a glance. */
export function getContactAvatarTint(key: string): string {
	let hash = 0;
	const normalized = getEmailAddress(key).toLowerCase();
	for (let index = 0; index < normalized.length; index += 1) {
		hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
	}
	return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}
