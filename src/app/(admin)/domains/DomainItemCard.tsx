import type { UseMutationResult } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { DnsStatusSummary, Domain } from "./types";
import { Tooltip } from "@/components/ui/tooltip";
import { domainColor } from "@/lib/domain-color";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, ChevronRight, Trash2 } from "lucide-react";

function HealthPill({ label, ok, detail }: { label: string; ok: boolean; detail?: string }) {
  return (
    <Tooltip label={detail ?? (ok ? `${label} configured` : `${label} needs attention`)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset",
          ok
            ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400"
            : "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-400",
        )}
      >
        {ok ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
        {label}
      </span>
    </Tooltip>
  );
}

export default function DomainItemCard({
  item,
  dns,
  remove,
  loadDns,
}: {
  item: Domain;
  dns?: DnsStatusSummary;
  remove: UseMutationResult<void, Error, string>;
  loadDns: (id: string) => Promise<void>;
}) {
  const color = domainColor(item.hostname);
  const active = item.status === "active";

  return (
    <div className="group flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-foreground/[0.02] sm:flex-row sm:items-center sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold", color.soft, color.text)}>
          {item.hostname.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{item.hostname}</span>
            <span className="relative flex size-2">
              {active && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-40" />}
              <span className={cn("relative inline-flex size-2 rounded-full", active ? "bg-emerald-500" : "bg-subtle-foreground")} />
            </span>
            <span className="text-xs capitalize text-muted-foreground">{item.status}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {dns ? (
              <>
                <HealthPill
                  label="Routing"
                  ok={dns.routing.configured}
                  detail={dns.routing.missing.length > 0 ? `Missing: ${dns.routing.missing.join(", ")}` : undefined}
                />
                <HealthPill
                  label="Sending"
                  ok={dns.sending.configured}
                  detail={dns.sending.records.length > 0 ? dns.sending.records.join(", ") : undefined}
                />
              </>
            ) : (
              <>
                {item.routingEnabled && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border">Routing</span>}
                {item.sendingEnabled && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11.5px] font-medium text-muted-foreground ring-1 ring-inset ring-border">Sending</span>}
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 pl-[54px] sm:pl-0">
        <Button variant="secondary" size="sm" onClick={() => loadDns(item.id)}>
          DNS records
          <ChevronRight className="-mr-1 size-3.5 opacity-60" />
        </Button>
        <Tooltip label="Remove domain">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove.mutate(item.id)}
            disabled={remove.isPending}
            aria-label={`Remove ${item.hostname}`}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
