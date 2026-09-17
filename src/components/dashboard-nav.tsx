"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Archive,
  Clock,
  FileText,
  Folder,
  Inbox,
  PenLine,
  Plus,
  Send,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip } from "@/components/ui/tooltip";
import { motion } from "motion/react";
import { SidebarFrame, SidebarSection } from "./app-shell";
import { useMessageCounts } from "@/hooks/use-message-counts";
import { authFetch } from "@/lib/auth/client";
import {
  DEFAULT_FOLDER_COLOR,
  FOLDER_COLOR_OPTIONS,
} from "@/lib/folders/colors";
import type { FolderColor } from "@/lib/folders/types";
import { cn } from "@/lib/utils";
import { NavItem } from "./components-nav";
import type { NavLink } from "./components-nav-types";
import type { CustomFolder } from "./dashboard-nav-types";
import {
  getFolderNavCount,
  moveMessagesToCustomFolder,
  moveMessagesToSystemFolder,
} from "./dashboard-nav-utils";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";
import { useSidebar } from "./sidebar-state";
import { DomainRail } from "./domain-rail";

const composeLink = { href: "/compose", label: "New message", icon: PenLine, primary: true };

const links = [
  { href: "/inbox", label: "Inbox", icon: Inbox, preloadMessages: true },
  { href: "/starred", label: "Starred", icon: Star, preloadMessages: true },
  { href: "/snoozed", label: "Snoozed", icon: Clock, preloadMessages: true },
  { href: "/sent", label: "Sent", icon: Send, preloadMessages: true },
  { href: "/drafts", label: "Drafts", icon: FileText, preloadMessages: true },
  {
    href: "/archived",
    label: "Archived",
    icon: Archive,
    preloadMessages: true,
  },
  { href: "/spam", label: "Spam", icon: ShieldAlert, preloadMessages: true },
  { href: "/trash", label: "Trash", icon: Trash2, preloadMessages: true },
];

export function DashboardNav({ className }: { className?: string }) {
  const { minimal } = useSidebar();
  const { selectedMailbox, isLoading } = useSelectedMailbox();
  const { counts } = useMessageCounts(selectedMailbox?.id, !isLoading);
  const [folders, setFolders] = useState<CustomFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] =
    useState<FolderColor>(DEFAULT_FOLDER_COLOR);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const linksWithCounts: NavLink[] = links.map((link): NavLink => {
    if (link.href === "/inbox") {
      return { ...link, count: getFolderNavCount("inbox", counts.folders) };
    }
    if (link.href === "/starred") {
      return { ...link, count: getFolderNavCount("starred", counts.folders) };
    }
    if (link.href === "/snoozed") {
      return { ...link, count: getFolderNavCount("snoozed", counts.folders) };
    }
    if (link.href === "/sent") {
      return { ...link, count: getFolderNavCount("sent", counts.folders) };
    }
    if (link.href === "/drafts") {
      return { ...link, count: getFolderNavCount("drafts", counts.folders) };
    }
    if (link.href === "/archived") {
      return {
        ...link,
        count: getFolderNavCount("archived", counts.folders),
        onMessageDrop: (messageIds: string[]) =>
          void moveMessagesToSystemFolder(messageIds, "archive"),
      };
    }
    if (link.href === "/spam") {
      return {
        ...link,
        count: getFolderNavCount("spam", counts.folders),
        onMessageDrop: (messageIds: string[]) =>
          void moveMessagesToSystemFolder(messageIds, "spam"),
      };
    }
    if (link.href === "/trash") {
      return {
        ...link,
        count: getFolderNavCount("trash", counts.folders),
        onMessageDrop: (messageIds: string[]) =>
          void moveMessagesToSystemFolder(messageIds, "trash"),
      };
    }
    return link;
  });

  useEffect(() => {
    if (!selectedMailbox?.id) {
      setFolders([]);
      return;
    }

    let cancelled = false;
    const params = new URLSearchParams({ mailboxId: selectedMailbox.id });
    authFetch(`/api/folders?${params.toString()}`)
      .then(
        (response) => response.json() as Promise<{ folders?: CustomFolder[] }>,
      )
      .then((data) => {
        if (!cancelled) setFolders(data.folders ?? []);
      })
      .catch(() => {
        if (!cancelled) setFolders([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMailbox?.id]);

  async function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMailbox?.id || !newFolderName.trim()) return;

    setAddingFolder(true);
    try {
      const response = await authFetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxId: selectedMailbox.id,
          name: newFolderName,
          color: newFolderColor,
        }),
      });
      if (!response.ok) return;
      const folder = (await response.json()) as CustomFolder;
      setFolders((items) =>
        [...items, folder].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setNewFolderName("");
      setNewFolderColor(DEFAULT_FOLDER_COLOR);
      setFolderDialogOpen(false);
    } finally {
      setAddingFolder(false);
    }
  }

  return (
    <SidebarFrame
      header={
        <div className="flex flex-col gap-3">
          <SidebarHeader href="/inbox" />
          <NavItem link={composeLink} />
        </div>
      }
      footer={<SidebarFooter />}
    >
      <div className={className}>
        <DomainRail />
        <SidebarSection label="Mail">
          {linksWithCounts.map((link, i) => (
            <NavItem link={link} key={`nav-${link.href || i}`} />
          ))}
        </SidebarSection>
        <SidebarSection
          label="Folders"
          action={
            selectedMailbox && (
              <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
                <Tooltip label="New folder" side="right">
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="flex size-6 items-center justify-center rounded-md text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label="Create folder"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </DialogTrigger>
                </Tooltip>
                <DialogContent className="w-[min(420px,calc(100vw-32px))]">
                  <DialogHeader>
                    <DialogTitle>New folder</DialogTitle>
                    <DialogDescription>
                      Organise mail in the selected mailbox. Drag messages onto a folder to file them.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createFolder} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="folderName">Name</Label>
                      <div className="relative">
                        <Folder
                          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 transition-colors"
                          style={{ color: newFolderColor }}
                        />
                        <Input
                          id="folderName"
                          value={newFolderName}
                          onChange={(event) => setNewFolderName(event.target.value)}
                          placeholder="Receipts"
                          className="pl-9"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label>Colour</Label>
                      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Folder color">
                        {FOLDER_COLOR_OPTIONS.map((option) => {
                          const selected = newFolderColor === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              aria-label={option.label}
                              title={option.label}
                              onClick={() => setNewFolderColor(option.value)}
                              className={cn(
                                "relative size-7 rounded-full transition-transform duration-150 hover:scale-110 active:scale-95",
                                selected && "scale-110",
                              )}
                              style={{ backgroundColor: option.value }}
                            >
                              {selected && (
                                <motion.span
                                  layoutId="folder-color-ring"
                                  className="absolute -inset-[3px] rounded-full ring-2"
                                  style={{ ["--tw-ring-color" as string]: option.value }}
                                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addingFolder || !newFolderName.trim()}>
                        {addingFolder ? "Creating…" : "Create folder"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )
          }
        >
          {!minimal && folders.length === 0 && (
            <p className="px-2.5 py-1 text-[12.5px] text-subtle-foreground">
              No folders yet
            </p>
          )}
          {folders.map((folder) => (
            <NavItem
              key={folder.id}
              link={{
                href: `/folders/${folder.id}`,
                label: folder.name,
                icon: Folder,
                preloadMessages: true,
                iconColor: folder.color,
                count: counts.customFolders[folder.id]?.unread,
                onMessageDrop: (messageIds: string[]) =>
                  void moveMessagesToCustomFolder(messageIds, folder.id),
              }}
            />
          ))}
        </SidebarSection>
      </div>
    </SidebarFrame>
  );
}
