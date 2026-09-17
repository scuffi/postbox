"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordForm } from "./change-password-form";
import { EmailClientsSettings } from "./email-clients-settings";
import { MfaSettings } from "./mfa-settings";
import { ForwardingEmailForm } from "./forwarding-email-form";
import { MailboxSignatureForm } from "./mailbox-signature-form";
import { ProfileForm } from "./profile-form";
import { PushNotificationSettings } from "./push-notification-settings";
import { SettingsCard, SettingsSection } from "./settings-section";
import { ThemeSegmented } from "@/components/theme-toggle";
import type { AccountSettingsResponse } from "./types";
import { loadAccountSettings } from "./utils";

export function AccountSettings() {
	const [user, setUser] = useState<AccountSettingsResponse["user"]>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		loadAccountSettings()
			.then((nextUser) => {
				if (!cancelled) setUser(nextUser);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load account");
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const header = <PageHeader title="Account" description="Your identity, sign-in security and how postbox looks for you." />;

	if (error) {
		return (
			<>
				{header}
				<p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</p>
			</>
		);
	}

	if (!user) {
		return (
			<>
				{header}
				<div className="grid gap-10 xl:grid-cols-[220px_1fr]">
					<div className="space-y-2">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-3 w-40" />
					</div>
					<Skeleton className="h-72 w-full rounded-2xl" />
				</div>
			</>
		);
	}

	return (
		<>
			{header}

			<SettingsSection title="Profile" description="How you appear to the people you email, and how to get back in if you're locked out.">
				<ProfileForm initialName={user.name} initialResetEmail={user.resetEmail ?? ""} email={user.email} />
			</SettingsSection>

			<SettingsSection title="Appearance" description="Pick a theme, or follow your system setting.">
				<SettingsCard>
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm font-medium text-foreground">Theme</p>
							<p className="text-[13px] text-muted-foreground">Light, dark or automatic.</p>
						</div>
						<ThemeSegmented />
					</div>
				</SettingsCard>
			</SettingsSection>

			<SettingsSection title="Notifications" description="Alerts for new mail on this device. Turn them on separately on each phone or computer.">
				<SettingsCard>
					<PushNotificationSettings />
				</SettingsCard>
			</SettingsSection>

			<SettingsSection title="Mail" description="Signature and forwarding for the inbox selected in the sidebar.">
				<SettingsCard title="Email signature" description="Added to new messages, replies and forwards.">
					<MailboxSignatureForm />
				</SettingsCard>
				{user.canForwardEmail && (
					<SettingsCard title="Forwarding" description="Send a copy of incoming messages to another address.">
						<ForwardingEmailForm initialForwardingEmail={user.forwardingEmail ?? ""} />
					</SettingsCard>
				)}
			</SettingsSection>

			<SettingsSection title="Security" description="Protect how you sign in to your account.">
				<SettingsCard title="Password" description="Use at least 8 characters.">
					<ChangePasswordForm />
				</SettingsCard>
				<SettingsCard title="Two-factor authentication" description="Require a code from an authenticator app when signing in.">
					<MfaSettings />
				</SettingsCard>
			</SettingsSection>

			<SettingsSection title="Email apps" description="Use your mail from a desktop or mobile app over JMAP.">
				<SettingsCard>
					<EmailClientsSettings />
				</SettingsCard>
			</SettingsSection>
		</>
	);
}
