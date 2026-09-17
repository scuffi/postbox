import type { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-full flex-col lg:flex-row">
			<SettingsNav />
			<div className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
				<div className="mx-auto w-full max-w-4xl">{children}</div>
			</div>
		</div>
	);
}
