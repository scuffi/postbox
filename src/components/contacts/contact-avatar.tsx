"use client";

import { useEffect, useState } from "react";
import { CONTACT_AVATAR_CHANGED_EVENT } from "@/lib/contacts/avatar-client";
import { normalizeEmailAddress } from "@/lib/email/address";
import { cn } from "@/lib/utils";
import type { ContactAvatarProps } from "./contact-avatar-types";
import {
	getContactAvatarInitial,
	getContactAvatarTint,
	getManagedContactAvatarUrl,
} from "./contact-avatar-utils";

export function ContactAvatar({
	mailboxId,
	address,
	name,
	hasManagedAvatar = false,
	managedAvatarUrl,
	className,
}: ContactAvatarProps) {
	const [managedAvatar, setManagedAvatar] = useState(hasManagedAvatar);
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
	const [imageFailed, setImageFailed] = useState(false);
	const [avatarVersion, setAvatarVersion] = useState(0);

	useEffect(() => {
		setManagedAvatar(hasManagedAvatar);
		setAvatarUrl(null);
		setImageFailed(false);
		setAvatarVersion(0);
	}, [address, hasManagedAvatar, mailboxId, managedAvatarUrl]);

	useEffect(() => {
		function onAvatarChanged(event: Event) {
			const detail = (event as CustomEvent<{ email?: string; hasAvatar?: boolean }>).detail;
			if (detail?.email === normalizeEmailAddress(address)) {
				setManagedAvatar(!!detail.hasAvatar);
				setAvatarVersion(Date.now());
			}
		}

		window.addEventListener(CONTACT_AVATAR_CHANGED_EVENT, onAvatarChanged);
		return () => window.removeEventListener(CONTACT_AVATAR_CHANGED_EVENT, onAvatarChanged);
	}, [address]);

	useEffect(() => {
		setImageFailed(false);
		if (managedAvatarUrl) {
			setAvatarUrl(managedAvatarUrl);
			return;
		}
		if (managedAvatar && mailboxId) {
			setAvatarUrl(getManagedContactAvatarUrl(mailboxId, address, avatarVersion));
			return;
		}
		setAvatarUrl(null);
	}, [address, avatarVersion, mailboxId, managedAvatar, managedAvatarUrl]);

	if (avatarUrl && !imageFailed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={avatarUrl}
				alt=""
				className={cn("size-8 shrink-0 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10", className)}
				onError={() => {
					if (managedAvatarUrl) setImageFailed(true);
					else if (managedAvatar) setManagedAvatar(false);
					else setImageFailed(true);
				}}
			/>
		);
	}

	return (
		<span
			className={cn(
				"flex size-8 shrink-0 select-none items-center justify-center rounded-full text-[12.5px] font-semibold ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]",
				getContactAvatarTint(address || name),
				className,
			)}
			aria-hidden
		>
			{getContactAvatarInitial(name, address)}
		</span>
	);
}
