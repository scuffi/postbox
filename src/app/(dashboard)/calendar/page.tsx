"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { ListCard, listRowClassName } from "@/components/ui/list-card";
import { PageHeader } from "@/components/ui/page-header";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { authFetch } from "@/lib/auth/client";
import { useSelectedMailbox } from "@/components/mailbox-provider";

type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  attendees: string;
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [adding, setAdding] = useState(false);
  const [guests, setGuests] = useState("");
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [pendingAction, setPendingAction] = useState<"save" | string | null>(null);
  const { selectedMailbox } = useSelectedMailbox();
  useEffect(() => {
    const start = new Date();
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    void authFetch(
      `/api/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`,
    )
      .then((response) => response.json())
      .then((data) => setEvents(data.events ?? []));
  }, []);
  async function addEvent() {
    setPendingAction("save");
    try {
    const response = await authFetch(
      editing ? `/api/calendar/events/${editing.id}` : "/api/calendar/events",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startsAt,
          endsAt,
          attendees: guests.split(","),
          mailboxId: selectedMailbox?.id,
          from:
            selectedMailbox?.senderAddresses?.[0] ??
            (selectedMailbox
              ? `${selectedMailbox.localPart}@${selectedMailbox.hostname}`
              : ""),
        }),
      },
    );
    const data = await response.json();
    if (response.ok) {
      setEvents((items) =>
        editing
          ? items.map((event) =>
              event.id === editing.id
                ? {
                    ...event,
                    title,
                    startsAt,
                    endsAt,
                    attendees: JSON.stringify(
                      guests.split(",").filter(Boolean),
                    ),
                  }
                : event,
            )
          : [...items, data.event].sort((a, b) =>
              a.startsAt.localeCompare(b.startsAt),
            ),
      );
      setTitle("");
      setStartsAt("");
      setEndsAt("");
      setGuests("");
      setEditing(null);
      setAdding(false);
    }
    } finally {
      setPendingAction(null);
    }
  }
  async function deleteEvent(id: string) {
    if (!window.confirm("Delete this event?")) return;
    setPendingAction(id);
    try {
    const response = await authFetch(`/api/calendar/events/${id}`, {
      method: "DELETE",
    });
    if (response.ok)
      setEvents((items) => items.filter((event) => event.id !== id));
    } finally {
      setPendingAction(null);
    }
  }
  function editEvent(event: CalendarEvent) {
    setEditing(event);
    setTitle(event.title);
    setStartsAt(event.startsAt.slice(0, 16));
    setEndsAt(event.endsAt.slice(0, 16));
    setGuests(JSON.parse(event.attendees || "[]").join(", "));
    setAdding(true);
  }
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8 lg:py-10">
      <PageHeader
        title="Calendar"
        description="Your upcoming events and meeting invitations."
        actions={
          <Button disabled={pendingAction !== null} onClick={() => { setEditing(null); setAdding(true); }}>
            <Plus />
            New event
          </Button>
        }
      />
      <Dialog
        open={adding}
        onOpenChange={(open) => {
          if (open || pendingAction === "save") return;
          setEditing(null);
          setAdding(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
            <DialogDescription>Guests receive an invitation by email.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title</Label>
              <Input
                id="event-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Quarterly planning"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-guests">Guests</Label>
              <Input
                id="event-guests"
                value={guests}
                onChange={(event) => setGuests(event.target.value)}
                placeholder="maya@example.com, sam@acme.dev"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="event-starts">Starts</Label>
                <Input
                  id="event-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  aria-label="Start date and time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-ends">Ends</Label>
                <Input
                  id="event-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  aria-label="End date and time"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" disabled={pendingAction === "save"} onClick={() => { setEditing(null); setAdding(false); }}>
              Cancel
            </Button>
            <Button
              onClick={() => void addEvent()}
              disabled={!title || !startsAt || !endsAt || pendingAction === "save"}
            >
              {pendingAction === "save" ? (editing ? "Saving…" : "Creating…") : (editing ? "Save changes" : "Create event")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ListCard>
        {events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="A clear month"
            description="No events yet. Create one, or accept an invitation from your inbox."
          />
        ) : (
          events.map((event) => {
            const start = new Date(event.startsAt);
            return (
              <div key={event.id} className={listRowClassName}>
                <div className="flex w-12 shrink-0 flex-col items-center overflow-hidden rounded-xl bg-card text-center ring-1 ring-inset ring-border">
                  <span className="w-full bg-primary py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                    {start.toLocaleDateString(undefined, { month: "short" })}
                  </span>
                  <span className="py-1 text-lg font-semibold leading-none tabular-nums text-foreground">{start.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {start.toLocaleDateString(undefined, { weekday: "long" })} · {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                <div className="flex items-center opacity-60 transition-opacity group-hover:opacity-100">
                  <Tooltip label="Edit">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit event"
                      disabled={pendingAction !== null}
                      onClick={() => void editEvent(event)}
                    >
                      <Pencil />
                    </Button>
                  </Tooltip>
                  <Tooltip label="Delete">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Delete event"
                      className="hover:bg-destructive/10 hover:text-destructive"
                      disabled={pendingAction !== null}
                      onClick={() => void deleteEvent(event.id)}
                    >
                      <Trash2 />{pendingAction === event.id && <span className="sr-only">Deleting…</span>}
                    </Button>
                  </Tooltip>
                </div>
              </div>
            );
          })
        )}
      </ListCard>
    </div>
  );
}
