"use client";

import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchActivity,
  formatActivityDate,
  getActivityLabel,
  getActivityMetadata,
} from "./utils";

export default function ActivityPage() {
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-2"
        title="Activity"
        description="Sign-ins and sign-outs across every account, with where they came from."
      />

      <section className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="data-table min-w-[760px] table-fixed">
          <thead>
            <tr>
              <th className="w-32">Activity</th>
              <th>User</th>
              <th className="w-64">Device</th>
              <th className="w-48">Time</th>
            </tr>
          </thead>
          <tbody>
            {activity.isLoading &&
              Array.from({ length: 7 }, (_, index) => (
                <tr key={index}>
                  <td>
                    <Skeleton className="h-6 w-20" />
                  </td>
                  <td>
                    <Skeleton className="h-9 w-48" />
                  </td>
                  <td>
                    <Skeleton className="h-9 w-40" />
                  </td>
                  <td>
                    <Skeleton className="h-4 w-32" />
                  </td>
                </tr>
              ))}
            {!activity.isLoading && (activity.data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted-foreground">
                  No login or logout activity yet
                </td>
              </tr>
            )}
            {(activity.data ?? []).map((log) => {
              const metadata = getActivityMetadata(log);
              const Icon = log.action === "auth.logout" ? LogOut : LogIn;
              return (
                <tr key={log.id}>
                  <td>
                    <Badge variant={log.action === "auth.logout" ? "secondary" : "success"} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {getActivityLabel(log.action)}
                    </Badge>
                  </td>
                  <td>
                    <p className="flex flex-col truncate font-medium text-foreground">
                      <span>{log.actorEmail ?? "(unknown email)"}</span>
                    </p>
                    <small className="text-muted-foreground">
                      {metadata.city || "(unknown city)"} •{" "}
                      {metadata.country || "(unknown country)"}
                    </small>
                  </td>
                  <td>
                    <p className="flex flex-col truncate font-medium text-foreground">
                      {metadata.device ?? "(unknown device)"}
                    </p>

                    <small className="text-muted-foreground">
                      {metadata.platform || "(unknown platform)"} •{" "}
                      {metadata.ipAddress ?? "(unknown IP)"}
                    </small>
                  </td>
                  <td className="text-muted-foreground tabular-nums">
                    {formatActivityDate(log.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
