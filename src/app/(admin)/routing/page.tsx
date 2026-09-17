"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DomainRouting } from "@/components/settings/domain-routing/domain-routing";
import { RoutingRuleSelect } from "@/components/settings/domain-routing/routing-rule-select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAdminRoutingDomains } from "./utils";

export default function RoutingPage() {
	const [domainId, setDomainId] = useState("");
	const domains = useQuery({
		queryKey: ["admin-routing-domains"],
		queryFn: fetchAdminRoutingDomains,
	});
	const availableDomains = domains.data?.domains ?? [];
	const selectedDomain = availableDomains.find((domain) => domain.id === domainId) ?? availableDomains[0];

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-display text-[40px] leading-[1.05] text-foreground">Routing</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Configure domain-wide delivery, forwarding, and blocking rules.
				</p>
			</div>

			<section className="space-y-4">
				<div>
					<h2 className="text-xl font-semibold text-foreground">Domain</h2>
					<p className="mt-1 text-sm text-muted-foreground">Choose which domain these global rules apply to.</p>
				</div>
				<div className="rounded-2xl border border-border bg-card p-6">
					{domains.isLoading ? (
						<Skeleton className="h-10 w-full" />
					) : domains.isError ? (
						<p className="text-sm text-destructive">{domains.error.message}</p>
					) : availableDomains.length === 0 ? (
						<p className="text-sm text-muted-foreground">Add a domain before configuring routing rules.</p>
					) : (
						<div className="grid gap-2">
							<Label htmlFor="routing-domain">Managed domain</Label>
							<RoutingRuleSelect
								id="routing-domain"
								value={selectedDomain?.id ?? ""}
								onChange={(event) => setDomainId(event.target.value)}
							>
								{availableDomains.map((domain) => (
									<option key={domain.id} value={domain.id}>
										{domain.hostname}
									</option>
								))}
							</RoutingRuleSelect>
						</div>
					)}
				</div>
			</section>

			{selectedDomain && <DomainRouting key={selectedDomain.id} domain={selectedDomain} />}
		</div>
	);
}
