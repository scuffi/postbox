"use client";

import { motion } from "motion/react";
import { BrandLockup } from "@/components/brand/postbox-mark";
import { PillarBoxIllustration, PillarBoxStage } from "@/components/brand/pillar-box-illustration";
import { useBranding } from "@/components/branding-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { AuthShellProps } from "./types";

export function AuthShell({ icon: Icon, title, description, children, footer, steps }: AuthShellProps) {
	const branding = useBranding();

	return (
		<div className="flex min-h-dvh bg-canvas text-foreground">
			<div className="flex min-h-dvh w-full flex-col px-5 py-5 sm:px-10 lg:w-[52%] lg:px-14 xl:px-20">
				<header className="flex items-center justify-between">
					<BrandLockup />
					<ThemeToggle />
				</header>

				<main className="flex flex-1 items-center justify-center py-10">
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
						className="w-full max-w-[400px]"
					>
						{steps && (
							<ol className="mb-8 flex items-center gap-2">
								{steps.map((step, index) => (
									<li key={step.label} className="flex items-center gap-2">
										<span
											className={cn(
												"flex h-7 items-center gap-2 rounded-full pl-1 pr-3 text-xs font-medium ring-1 ring-inset transition-colors",
												step.active
													? "bg-primary-soft text-primary-soft-foreground ring-primary/25"
													: "bg-card text-muted-foreground ring-border",
											)}
										>
											<span
												className={cn(
													"flex size-5 items-center justify-center rounded-full text-[10.5px] font-semibold",
													step.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
												)}
											>
												{index + 1}
											</span>
											{step.label}
										</span>
										{index < steps.length - 1 && <span className="h-px w-6 bg-border-strong" />}
									</li>
								))}
							</ol>
						)}

						<span className="mb-6 flex size-11 items-center justify-center rounded-2xl bg-card text-primary shadow-panel">
							<Icon className="size-5" />
						</span>
						<h1 className="font-display text-[42px] leading-[1.02] tracking-[-0.01em] text-foreground">{title}</h1>
						{description && <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{description}</p>}

						<div className="mt-8">{children}</div>
						{footer && <div className="mt-8 text-sm font-medium">{footer}</div>}
					</motion.div>
				</main>

				<footer className="flex items-center justify-between text-xs text-subtle-foreground">
					<span>{branding.appName} · Self-hosted mail for every domain you own</span>
				</footer>
			</div>

			<div className="hidden flex-1 p-3 pl-0 lg:block">
				<PillarBoxStage className="flex h-full flex-col rounded-[28px]">
					<div className="flex flex-1 items-center justify-center px-16 pt-16">
						<PillarBoxIllustration className="max-w-[240px] xl:max-w-[270px]" />
					</div>
					<div className="px-12 pb-12 pt-6 text-white xl:px-16">
						<p className="font-display text-[40px] leading-[1.05] tracking-[-0.01em] xl:text-[46px]">
							Every domain.
							<br />
							<span className="italic text-white/70">One beautiful inbox.</span>
						</p>
						<p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
							Route, read and reply across all of your addresses — self-hosted on your own infrastructure.
						</p>
					</div>
				</PillarBoxStage>
			</div>
		</div>
	);
}
