"use client";

import { ComposeForm } from "@/components/compose/compose-form";
import { PageHeader } from "@/components/ui/page-header";

export default function ComposePage() {
	return (
		<div className="mx-auto h-full w-full max-w-4xl overflow-auto px-5 py-8 sm:px-8 lg:py-10">
			<PageHeader title="New message" description="Drafts save automatically as you write." />
			<ComposeForm mode="page" />
		</div>
	);
}
