import { InboxThreadingSettings } from "@/components/settings/inbox-threading-settings";
import { InboxShortcutsSettings } from "@/components/settings/inbox-shortcuts-settings";
import { MailboxAutoReplyForm } from "@/components/settings/mailbox-auto-reply-form";
import { SettingsCard, SettingsSection } from "@/components/settings/settings-section";
import { SpamFilterSettings } from "@/components/settings/spam-filter-settings";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsInboxPage() {
	return (
		<>
			<PageHeader title="Inbox" description="How mail is filtered, grouped and answered when you're away." />
			<SettingsSection title="Spam protection" description="Local spam analysis for incoming messages.">
				<SettingsCard>
					<SpamFilterSettings />
				</SettingsCard>
			</SettingsSection>
			<SettingsSection title="Conversations" description="Choose how emails are organised in your lists.">
				<SettingsCard>
					<InboxThreadingSettings />
				</SettingsCard>
			</SettingsSection>
			<SettingsSection title="Shortcuts" description="Fly through mail with quick keys and ⌘K.">
				<SettingsCard>
					<InboxShortcutsSettings />
				</SettingsCard>
			</SettingsSection>
			<SettingsSection title="Auto-reply" description="An automatic response for the inbox selected in the sidebar.">
				<SettingsCard>
					<MailboxAutoReplyForm />
				</SettingsCard>
			</SettingsSection>
		</>
	);
}
