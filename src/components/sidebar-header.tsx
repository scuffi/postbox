"use client";

import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandLockup, BrandMark } from "@/components/brand/postbox-mark";
import { Tooltip } from "@/components/ui/tooltip";
import { useSidebar } from "./sidebar-state";
import type { SidebarHeaderProps } from "./sidebar-state-types";

export function SidebarHeader({ href, label }: SidebarHeaderProps) {
	const { minimal, toggle, mobileOpen } = useSidebar();

	if (minimal) {
		return (
			<Tooltip label="Expand sidebar" side="right" shortcut="[">
				<button
					type="button"
					onClick={toggle}
					className="group relative mx-auto flex size-10 items-center justify-center rounded-xl transition-colors hover:bg-accent"
					aria-label="Expand menu"
				>
					<BrandMark className="transition-opacity group-hover:opacity-0" />
					<PanelLeftOpen className="absolute size-[18px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
				</button>
			</Tooltip>
		);
	}

	return (
		<div className="flex h-10 items-center justify-between gap-2 pl-1.5">
			<Link href={href} className="min-w-0 rounded-lg py-1 pr-2 transition-opacity hover:opacity-80">
				<BrandLockup label={label} />
			</Link>
			{!mobileOpen && (
				<Tooltip label="Collapse sidebar" side="right" shortcut="[">
					<button
						type="button"
						onClick={toggle}
						className="flex size-8 items-center justify-center rounded-lg text-subtle-foreground transition-colors hover:bg-accent hover:text-foreground"
						aria-label="Collapse menu"
					>
						<PanelLeftClose className="size-[17px]" />
					</button>
				</Tooltip>
			)}
		</div>
	);
}
