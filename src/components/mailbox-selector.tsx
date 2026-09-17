"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, ChevronsUpDown, Inbox, Keyboard, LogOut, Settings, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import packageJson from "../../package.json";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authFetch } from "@/lib/auth/client";
import { logoutClientSession } from "@/lib/auth/logout";
import { PROFILE_AVATAR_CHANGED_EVENT, getProfileAvatarUrl } from "@/lib/profile/avatar-client";
import { PROFILE_NAME_CHANGED_EVENT } from "@/lib/profile/name-client";
import type { ProfileAvatarChangedDetail, ProfileNameChangedDetail } from "@/lib/profile/types";
import { cn } from "@/lib/utils";
import { useShortcuts } from "./shortcuts";
import { useSidebar } from "./sidebar-state";
import { ThemeSegmented } from "./theme-toggle";
import { getAccountInitial, isAdminPath } from "./mailbox-selector-utils";
import type { AccountAvatarProps, MailboxSelectorUser } from "./mailbox-selector-types";

export function AccountAvatar({
	name,
	hasAvatar = false,
	avatarUrl = "/api/profile/avatar",
	size = "small",
	onAvatarError,
}: AccountAvatarProps) {
	const sizeClass = size === "large" ? "size-10 text-sm" : "size-7 text-[11px]";
	const [imageFailed, setImageFailed] = useState(false);

	useEffect(() => {
		setImageFailed(false);
	}, [avatarUrl, hasAvatar]);

	if (hasAvatar && !imageFailed) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={avatarUrl}
				alt={`${name} profile picture`}
				className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10`}
				onError={() => {
					setImageFailed(true);
					onAvatarError?.();
				}}
			/>
		);
	}

	return (
		<div
			className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-stone-700 to-stone-900 font-semibold text-white ring-1 ring-black/5 dark:from-stone-300 dark:to-stone-500 dark:text-stone-950`}
			aria-hidden="true"
		>
			{getAccountInitial(name)}
		</div>
	);
}

/**
 * Account menu pinned to the foot of the sidebar. Mailbox selection lives in the
 * domain rail, so this is the signed-in user's profile plus app-level actions.
 */
export function MailboxSelector() {
	const pathname = usePathname();
	const router = useRouter();
	const { minimal } = useSidebar();
	const { openHelpModal, shortcutsEnabled, shortcutsPreferenceLoading } = useShortcuts();
	const [user, setUser] = useState<MailboxSelectorUser | null>(null);
	const [hasAvatar, setHasAvatar] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState("/api/profile/avatar");

	useEffect(() => {
		authFetch("/api/auth/me", { redirectOnUnauthorized: false })
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => {
				const authData = data as { user?: MailboxSelectorUser } | null;
				setUser(authData?.user ?? null);
				setHasAvatar(!!authData?.user?.hasAvatar);
			})
			.catch(() => setUser(null));
	}, []);

	useEffect(() => {
		function onAvatarChanged(event: Event) {
			const detail = (event as CustomEvent<ProfileAvatarChangedDetail>).detail;
			setAvatarUrl(detail?.url ?? getProfileAvatarUrl());
			setHasAvatar(true);
		}

		window.addEventListener(PROFILE_AVATAR_CHANGED_EVENT, onAvatarChanged);
		return () => window.removeEventListener(PROFILE_AVATAR_CHANGED_EVENT, onAvatarChanged);
	}, []);

	useEffect(() => {
		function onNameChanged(event: Event) {
			const { name } = (event as CustomEvent<ProfileNameChangedDetail>).detail;
			setUser((current) => (current ? { ...current, name } : current));
		}

		window.addEventListener(PROFILE_NAME_CHANGED_EVENT, onNameChanged);
		return () => window.removeEventListener(PROFILE_NAME_CHANGED_EVENT, onNameChanged);
	}, []);

	const name = user?.name ?? "Account";
	const email = user?.email ?? "";
	const adminActive = isAdminPath(pathname);

	async function logout() {
		await logoutClientSession();
		router.replace("/login");
		router.refresh();
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						"group flex w-full items-center gap-2.5 rounded-xl text-left outline-none transition-colors hover:bg-foreground/[0.04] data-[state=open]:bg-foreground/[0.05]",
						minimal ? "mx-auto size-10 justify-center" : "h-11 px-2",
					)}
					aria-label="Open account menu"
				>
					<AccountAvatar name={name} hasAvatar={hasAvatar} avatarUrl={avatarUrl} onAvatarError={() => setHasAvatar(false)} />
					{!minimal && (
						<>
							<span className="min-w-0 flex-1 leading-tight">
								<span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
								<span className="block truncate text-[11.5px] text-muted-foreground">{email}</span>
							</span>
							<ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground transition-colors group-hover:text-muted-foreground" />
						</>
					)}
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent side={minimal ? "right" : "top"} align={minimal ? "end" : "start"} className="w-[264px]">
				<div className="flex items-center gap-3 px-2 pb-2.5 pt-2">
					<AccountAvatar name={name} hasAvatar={hasAvatar} avatarUrl={avatarUrl} size="large" onAvatarError={() => setHasAvatar(false)} />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-semibold text-foreground">{name}</p>
						<p className="truncate text-xs text-muted-foreground">{email}</p>
					</div>
				</div>
				<DropdownMenuSeparator />
				{adminActive ? (
					<DropdownMenuItem asChild>
						<Link href="/inbox">
							<Inbox />
							Back to mail
						</Link>
					</DropdownMenuItem>
				) : null}
				<DropdownMenuItem asChild>
					<Link href="/calendar">
						<CalendarDays />
						Calendar
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link href="/settings/account">
						<Settings />
						Settings
					</Link>
				</DropdownMenuItem>
				{user?.role === "admin" && !adminActive && (
					<DropdownMenuItem asChild>
						<Link href="/admin">
							<ShieldCheck />
							Admin
						</Link>
					</DropdownMenuItem>
				)}
				{shortcutsEnabled && !shortcutsPreferenceLoading && (
					<DropdownMenuItem onSelect={() => openHelpModal()} shortcut="?">
						<Keyboard />
						Keyboard shortcuts
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<div className="flex h-9 items-center justify-between px-2 text-[13px] text-foreground">
					Appearance
					<ThemeSegmented />
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={() => void logout()}>
					<LogOut />
					Sign out
				</DropdownMenuItem>
				<p className="px-2 pb-1 pt-1.5 text-[11px] text-subtle-foreground">postbox v{packageJson.version}</p>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
