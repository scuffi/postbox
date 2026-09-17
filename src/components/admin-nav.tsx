"use client";

import {
  ArrowLeft,
  DatabaseBackup,
  Globe2,
  Activity,
  Mail,
  LayoutDashboard,
  Palette,
  Users,
  Route,
  Webhook,
} from "lucide-react";
import { NavItem } from "./components-nav";
import { SidebarFooter } from "./sidebar-footer";
import { useBranding } from "./branding-provider";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFrame, SidebarSection } from "./app-shell";

const sections = [
  {
    links: [
      { href: "/inbox", label: "Back to mail", icon: ArrowLeft },
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    label: "Email",
    links: [
      { href: "/mailboxes", label: "Mailboxes", icon: Mail },
      { href: "/domains", label: "Domains", icon: Globe2 },
      { href: "/routing", label: "Routing", icon: Route },
      { href: "/webhooks", label: "Webhooks", icon: Webhook },
    ],
  },
  {
    label: "Administration",
    links: [
      { href: "/accounts", label: "Accounts", icon: Users },
      { href: "/activity", label: "Activity", icon: Activity },
      { href: "/backups", label: "Backups", icon: DatabaseBackup },
    ],
  },
  {
    label: "Product",
    links: [
      { href: "/branding", label: "Branding", icon: Palette },
    ],
  },
];

export function AdminNav({ className }: { className?: string }) {
  const branding = useBranding();

  return (
    <SidebarFrame header={<SidebarHeader href="/admin" label="Admin" />} footer={<SidebarFooter />}>
      <div className={className}>
        {sections.map((section) => {
          const links = section.links.filter(
            (link) => link.href !== "/branding" || branding.canCustomizeBranding,
          );
          if (links.length === 0) return null;

          return (
            // The first section has no label, so fall back to its first href for a stable key.
            <SidebarSection key={section.label ?? links[0].href} label={section.label}>
              {links.map((link) => (
                <NavItem link={link} key={link.href} layoutGroup="admin" />
              ))}
            </SidebarSection>
          );
        })}
      </div>
    </SidebarFrame>
  );
}
