"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Command, Globe2, Inbox, LockKeyhole, Search, Sparkles, Star, Zap } from "lucide-react";
import { BrandLockup } from "@/components/brand/postbox-mark";
import { PillarBoxIllustration, PillarBoxStage } from "@/components/brand/pillar-box-illustration";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { authFetch, getClientSessionToken } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { getHomeActions } from "./utils";

const previewRows = [
	{ from: "Globex Sales", subject: "Partnership intro", preview: "Hi team, we would love to explore a partnership…", domain: "acme.dev", dot: "bg-violet-500", tint: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", unread: true, time: "09:41" },
	{ from: "Maya Chen", subject: "Cannot access workspace", preview: "I reset my password this morning, but the login page…", domain: "support@", dot: "bg-sky-500", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", unread: true, time: "09:12", starred: true },
	{ from: "Contoso Finance", subject: "Invoice address update", preview: "Please update our invoice contact to finance-team…", domain: "billing@", dot: "bg-teal-500", tint: "bg-stone-200 text-stone-700 dark:bg-stone-500/20 dark:text-stone-300", time: "Yesterday" },
	{ from: "Northwind DevOps", subject: "Webhook retry question", preview: "We noticed three delivery attempts for the same event…", domain: "support@", dot: "bg-sky-500", tint: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300", time: "Sep 14" },
];

const features = [
	{ icon: Globe2, title: "Every domain, one inbox", description: "Colour-coded mailboxes across all your domains, with catch-alls, aliases and routing rules that just work." },
	{ icon: Zap, title: "Built for speed", description: "Command palette, keyboard shortcuts and optimistic actions. Inbox zero without touching the mouse." },
	{ icon: LockKeyhole, title: "Yours, end to end", description: "Self-hosted on Cloudflare or your own server. Your mail, your data, your infrastructure." },
];

function ProductPreview() {
	return (
		<div className="overflow-hidden rounded-2xl bg-canvas p-2 shadow-float ring-1 ring-border">
			<div className="flex gap-2">
				<div className="hidden w-44 shrink-0 flex-col gap-1 p-2 sm:flex">
					<BrandLockup className="mb-3 [&_span:last-child]:text-[13px] [&_svg]:size-6" />
					<div className="mb-2 flex h-8 items-center gap-2 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground shadow-button">
						<Sparkles className="size-3.5" /> New message
					</div>
					{[
						{ label: "All inboxes", icon: Inbox, count: 12, active: true },
						{ label: "acme.dev", dot: "bg-violet-500", count: 4 },
						{ label: "example.com", dot: "bg-sky-500", count: 8 },
						{ label: "Starred", icon: Star },
					].map((item) => (
						<div
							key={item.label}
							className={cn(
								"flex h-7 items-center gap-2 rounded-lg px-2 text-xs font-medium",
								item.active ? "bg-card text-foreground shadow-panel dark:bg-accent" : "text-muted-foreground",
							)}
						>
							{item.icon ? <item.icon className={cn("size-3.5", item.active && "text-primary")} /> : <span className={cn("ml-1 mr-0.5 size-1.5 rounded-full", item.dot)} />}
							<span className="flex-1 truncate">{item.label}</span>
							{item.count && <span className="text-[10.5px] tabular-nums text-muted-foreground">{item.count}</span>}
						</div>
					))}
				</div>
				<div className="min-w-0 flex-1 overflow-hidden rounded-xl bg-card shadow-panel">
					<div className="flex h-12 items-center gap-3 border-b border-border px-4">
						<span className="font-display text-xl leading-none">Inbox</span>
						<span className="text-[11px] font-medium text-primary">12 unread</span>
						<span className="flex-1" />
						<span className="hidden h-7 w-44 items-center gap-2 rounded-lg bg-foreground/[0.045] px-2 text-[11px] text-muted-foreground md:flex">
							<Search className="size-3" /> Search mail <Kbd className="ml-auto h-4 text-[9px]">⌘K</Kbd>
						</span>
					</div>
					<div className="space-y-px p-1.5">
						{previewRows.map((row, index) => (
							<motion.div
								key={row.from}
								initial={{ opacity: 0, x: -8 }}
								whileInView={{ opacity: 1, x: 0 }}
								viewport={{ once: true }}
								transition={{ delay: 0.1 + index * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
								className={cn("relative flex h-11 items-center gap-3 rounded-lg px-3", index === 0 && "bg-primary-soft/60")}
							>
								{row.unread && <span className="absolute left-1 size-1 rounded-full bg-primary" />}
								<span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold", row.tint)}>{row.from.charAt(0)}</span>
								<span className={cn("w-28 shrink-0 truncate text-xs", row.unread ? "font-semibold" : "font-medium text-foreground/80")}>{row.from}</span>
								<span className="hidden shrink-0 items-center gap-1 rounded bg-foreground/[0.04] px-1 text-[10px] text-muted-foreground ring-1 ring-inset ring-border/70 lg:inline-flex">
									<span className={cn("size-1 rounded-full", row.dot)} />
									{row.domain}
								</span>
								<span className="min-w-0 flex-1 truncate text-xs">
									<span className={row.unread ? "font-semibold" : "text-foreground/80"}>{row.subject}</span>
									<span className="text-muted-foreground"> — {row.preview}</span>
								</span>
								{row.starred && <Star className="size-3 shrink-0 fill-gold text-gold" />}
								<span className={cn("shrink-0 text-[10.5px] tabular-nums", row.unread ? "font-medium text-primary" : "text-subtle-foreground")}>{row.time}</span>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function HomePage() {
	const [hasUser, setHasUser] = useState(false);

	useEffect(() => {
		let cancelled = false;
		if (!getClientSessionToken()) return;

		authFetch("/api/auth/me", { redirectOnUnauthorized: false })
			.then((response) => {
				if (!cancelled) setHasUser(response.ok);
			})
			.catch(() => {
				if (!cancelled) setHasUser(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const actions = getHomeActions(hasUser);

	return (
		<div className="min-h-dvh overflow-x-hidden bg-canvas text-foreground">
			<header className="sticky top-0 z-30 border-b border-transparent bg-canvas/70 backdrop-blur-xl">
				<div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
					<Link href="/" aria-label="Home">
						<BrandLockup />
					</Link>
					<div className="flex items-center gap-1.5">
						<ThemeToggle />
						{actions.map((action) => (
							<Button key={action.href} variant={action.variant === "outline" ? "ghost" : action.variant} size="sm" asChild>
								<Link href={action.href}>{action.label}</Link>
							</Button>
						))}
					</div>
				</div>
			</header>

			<main>
				<section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 pb-16 pt-10 sm:px-8 md:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
					>
						<span className="inline-flex h-7 items-center gap-2 rounded-full bg-card pl-1 pr-3 text-xs font-medium text-muted-foreground shadow-panel">
							<span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-soft-foreground">New</span>
							Self-hosted mail, reimagined
						</span>
						<h1 className="mt-6 font-display text-[56px] leading-[0.95] tracking-[-0.02em] text-foreground sm:text-[76px] lg:text-[88px]">
							Every domain.
							<br />
							<span className="italic text-primary">One beautiful</span> inbox.
						</h1>
						<p className="mt-6 max-w-lg text-[17px] leading-relaxed text-muted-foreground">
							postbox brings every address you own into a single, fast, keyboard-first inbox — running on your own infrastructure.
						</p>
						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
							<Button size="lg" asChild>
								<Link href={actions.at(-1)?.href ?? "/setup"}>
									{hasUser ? "Open your inbox" : "Get started"}
									<ArrowRight />
								</Link>
							</Button>
							<Button size="lg" variant="secondary" asChild>
								<Link href={hasUser ? "/inbox" : "/login"}>{hasUser ? "View inbox" : "Sign in"}</Link>
							</Button>
							<span className="hidden items-center gap-1.5 pl-2 text-xs text-subtle-foreground sm:flex">
								<Command className="size-3.5" /> Press <Kbd>⌘K</Kbd> anywhere
							</span>
						</div>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, scale: 0.97 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
					>
						<PillarBoxStage className="flex aspect-[4/4.2] items-center justify-center rounded-[32px] px-10 py-12 sm:aspect-[4/3.8]">
							<PillarBoxIllustration className="max-w-[210px] sm:max-w-[230px]" />
						</PillarBoxStage>
					</motion.div>
				</section>

				<section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
					<motion.div
						initial={{ opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-80px" }}
						transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
					>
						<ProductPreview />
					</motion.div>

					<div className="mt-16 grid gap-3 md:grid-cols-3">
						{features.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
								className="rounded-2xl border border-border bg-card p-6"
							>
								<span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
									<feature.icon className="size-[18px]" />
								</span>
								<h3 className="mt-5 text-[15px] font-semibold tracking-[-0.01em]">{feature.title}</h3>
								<p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{feature.description}</p>
							</motion.div>
						))}
					</div>
				</section>
			</main>

			<footer className="border-t border-border">
				<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 text-xs text-subtle-foreground sm:px-8">
					<BrandLockup className="opacity-70 [&_span:last-child]:text-[13px] [&_svg]:size-5" />
					<span>Self-hosted mail for every domain you own</span>
				</div>
			</footer>
		</div>
	);
}
