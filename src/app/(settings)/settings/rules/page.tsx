import { InboxRules } from "@/components/settings/inbox-rules";
import { DomainRouting } from "@/components/settings/domain-routing/domain-routing";
import { PageHeader } from "@/components/ui/page-header";

export default function SettingsRulesPage() {
	return (
		<div>
			<PageHeader title="Rules & routing" description="Decide where mail lands before and after it reaches your inbox." />
			<div className="space-y-12">
				<DomainRouting />
				<InboxRules />
			</div>
		</div>
	);
}
