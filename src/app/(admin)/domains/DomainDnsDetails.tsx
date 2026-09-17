import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDnsRecordLabel } from "./domain-dns-details-utils";
import type { DomainDnsDetailsProps } from "./types";

function RecordRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
	return (
		<li className="flex items-start gap-3 px-4 py-2.5">
			<span
				className={cn(
					"mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
					ok ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
				)}
			>
				{ok ? <Check className="size-2.5" strokeWidth={3} /> : <AlertTriangle className="size-2.5" strokeWidth={3} />}
			</span>
			<span className="min-w-0 break-all font-mono text-[12.5px] leading-5 text-foreground/85">{children}</span>
		</li>
	);
}

export default function DomainDnsDetails({ domain, dns }: DomainDnsDetailsProps) {
	return (
		<section className="animate-fade-up overflow-hidden rounded-2xl border border-border bg-card">
			<header className="border-b border-border bg-elevated/60 px-5 py-4">
				<p className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">DNS records</p>
				<h2 className="mt-0.5 text-[15px] font-semibold text-foreground">{domain.hostname}</h2>
			</header>
			<div className="grid divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
				<div>
					<h3 className="px-4 pb-1 pt-4 text-[13px] font-semibold text-foreground">Email Routing</h3>
					<ul className="pb-2">
						{dns.routing.records.map((record, index) => (
							<RecordRow key={`routing-${record.type}-${record.name}-${index}`} ok>
								{getDnsRecordLabel(record)}
							</RecordRow>
						))}
						{dns.routing.missing.map((record, index) => (
							<RecordRow key={`missing-${record.type}-${record.name}-${index}`} ok={false}>
								{getDnsRecordLabel(record)}
							</RecordRow>
						))}
						{dns.routing.records.length === 0 && dns.routing.missing.length === 0 && (
							<RecordRow ok={!!domain.routingEnabled}>
								<span className="font-sans">{domain.routingEnabled ? "Email routing is configured" : "No routing DNS records found"}</span>
							</RecordRow>
						)}
					</ul>
				</div>
				<div>
					<h3 className="px-4 pb-1 pt-4 text-[13px] font-semibold text-foreground">Email Sending</h3>
					<ul className="pb-2">
						{dns.sending.map((record, index) => (
							<RecordRow key={`sending-${record.type}-${record.name}-${index}`} ok>
								{getDnsRecordLabel(record)}
							</RecordRow>
						))}
						{dns.sending.length === 0 && (
							<RecordRow ok={!!domain.sendingEnabled}>
								<span className="font-sans">{domain.sendingEnabled ? "Email sending is configured" : "No sending DNS records found"}</span>
							</RecordRow>
						)}
					</ul>
				</div>
			</div>
		</section>
	);
}
