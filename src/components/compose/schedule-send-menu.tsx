"use client";

import { CalendarClock, ChevronDown, Clock, X } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDateTimeLocal, getScheduleSendOptions, parseDateTimeLocal } from "./schedule-send-utils";
import type { ScheduleSendMenuProps } from "./schedule-send-types";

export function ScheduleSendMenu({ disabled, value, onChange, variant = "split" }: ScheduleSendMenuProps) {
	const options = getScheduleSendOptions();
	const minimum = new Date(Date.now() + 5 * 60 * 1000);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				type="button"
				disabled={disabled}
				aria-label="Schedule send options"
				className={cn(
					variant === "split"
						? "inline-flex h-8 items-center justify-center rounded-r-xl border-l border-black/15 bg-gradient-to-b from-[color-mix(in_oklab,var(--primary)_90%,white)] to-primary px-2 text-primary-foreground transition-[filter] hover:brightness-[1.06] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:brightness-95"
						: "flex size-11 items-center justify-center rounded-full transition-colors focus-visible:outline-none active:bg-accent disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent",
					variant === "icon" && (value ? "bg-primary-soft text-primary-soft-foreground" : "text-muted-foreground"),
				)}
			>
				{variant === "split" ? <ChevronDown className="size-3.5" /> : <CalendarClock className="size-5" />}
			</DropdownMenuTrigger>
			<DropdownMenuContent align={variant === "split" ? "start" : "end"} side="top" className="w-64">
				<DropdownMenuLabel>Schedule send</DropdownMenuLabel>
				{value && (
					<>
						<DropdownMenuItem onSelect={() => onChange(null)}>
							<X />
							Clear schedule
						</DropdownMenuItem>
						<DropdownMenuSeparator />
					</>
				)}
				{options.map((option) => (
					<DropdownMenuItem key={option.label} onSelect={() => onChange(option.value)}>
						<Clock />
						{option.label}
						<span className="ml-auto text-xs tabular-nums text-subtle-foreground">
							{option.value?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
						</span>
					</DropdownMenuItem>
				))}
				<DropdownMenuSeparator />
				<DropdownMenuLabel className="flex items-center gap-1.5">
					<CalendarClock className="size-3" />
					Pick date &amp; time
				</DropdownMenuLabel>
				<div className="px-1 pb-1">
					<input
						type="datetime-local"
						min={formatDateTimeLocal(minimum)}
						value={value ? formatDateTimeLocal(value) : ""}
						onChange={(event) => onChange(parseDateTimeLocal(event.target.value))}
						onKeyDown={(event) => event.stopPropagation()}
						className="h-9 w-full rounded-lg bg-muted px-2.5 text-[13px] text-foreground outline-none ring-1 ring-inset ring-border focus:ring-ring/40"
					/>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
