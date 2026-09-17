"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

const floatingMail = [
	{ from: "Globex Sales", subject: "Partnership intro", domain: "acme.dev", dot: "bg-violet-400", className: "-left-[78%] top-[20%]", delay: 0.6 },
	{ from: "Contoso Finance", subject: "Invoice address update", domain: "example.com", dot: "bg-sky-400", className: "-right-[64%] top-[46%]", delay: 1.1 },
	{ from: "Northwind DevOps", subject: "Webhook retry question", domain: "support@", dot: "bg-emerald-400", className: "-left-[66%] bottom-[14%]", delay: 1.6 },
];

function Envelope({ delay, x }: { delay: number; x: number }) {
	const reduce = useReducedMotion();
	return (
		<motion.g
			initial={{ y: -70, opacity: 0, rotate: -8 }}
			animate={reduce ? { y: 60, opacity: 0.9, rotate: 0 } : { y: [-70, 40, 118], opacity: [0, 1, 0], rotate: [-8, 0, 0], scaleY: [1, 1, 0.3] }}
			transition={reduce ? { duration: 0 } : { duration: 2.4, delay, repeat: Infinity, repeatDelay: 2.2, ease: [0.45, 0, 0.2, 1], times: [0, 0.55, 1] }}
			style={{ transformOrigin: `${120 + x}px 150px` }}
		>
			<rect x={93 + x} y={100} width={54} height={34} rx={3} fill="#fbfaf8" />
			<path d={`M${93 + x} ${103} L${120 + x} ${121} L${147 + x} ${103}`} fill="none" stroke="#d9d3cc" strokeWidth={1.5} />
			<rect x={134 + x} y={106} width={8} height={9} rx={1} fill="#da202a" opacity={0.85} />
		</motion.g>
	);
}

/** A stylised pillar box with letters dropping through the slot. */
export function PillarBoxIllustration({ className, showMail = true }: { className?: string; showMail?: boolean }) {
	const id = useId().replace(/:/g, "");
	const reduce = useReducedMotion();

	return (
		<div className={cn("relative mx-auto aspect-[240/440] w-full max-w-[280px]", className)}>
			<svg viewBox="0 0 240 440" className="relative z-10 size-full overflow-visible drop-shadow-[0_40px_60px_rgba(0,0,0,0.45)]">
				<defs>
					<linearGradient id={`body-${id}`} x1="0" x2="1">
						<stop offset="0" stopColor="#8f0f16" />
						<stop offset="0.28" stopColor="#e3303a" />
						<stop offset="0.5" stopColor="#da202a" />
						<stop offset="1" stopColor="#6e0a10" />
					</linearGradient>
					<linearGradient id={`cap-${id}`} x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#f0474f" />
						<stop offset="1" stopColor="#a8121a" />
					</linearGradient>
					<radialGradient id={`shadow-${id}`} cx="0.5" cy="0.5" r="0.5">
						<stop offset="0" stopColor="#000" stopOpacity="0.45" />
						<stop offset="1" stopColor="#000" stopOpacity="0" />
					</radialGradient>
					<clipPath id={`slot-${id}`}>
						<rect x="0" y="0" width="240" height="183" />
					</clipPath>
				</defs>

				<ellipse cx="120" cy="424" rx="110" ry="14" fill={`url(#shadow-${id})`} />

				{/* Letters fall behind the cap and vanish into the slot. */}
				<g clipPath={`url(#slot-${id})`}>
					<Envelope delay={0.2} x={0} />
					<Envelope delay={2.5} x={-6} />
				</g>

				{/* Plinth */}
				<rect x="38" y="386" width="164" height="30" rx="5" fill="#5c080d" />
				<rect x="46" y="378" width="148" height="14" rx="3" fill="#7d0c13" />

				{/* Body */}
				<rect x="56" y="150" width="128" height="232" fill={`url(#body-${id})`} />
				<rect x="72" y="150" width="10" height="232" fill="#fff" opacity="0.09" />

				{/* Door */}
				<rect x="80" y="246" width="80" height="112" rx="5" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="2" />
				<rect x="90" y="262" width="60" height="38" rx="3" fill="#fbfaf8" opacity="0.92" />
				<rect x="97" y="271" width="34" height="3" rx="1.5" fill="#1c1917" opacity="0.5" />
				<rect x="97" y="279" width="46" height="3" rx="1.5" fill="#1c1917" opacity="0.25" />
				<rect x="97" y="287" width="26" height="3" rx="1.5" fill="#1c1917" opacity="0.25" />
				<circle cx="150" cy="332" r="4" fill="#3d0709" opacity="0.6" />

				{/* Cypher plaque */}
				<circle cx="120" cy="222" r="15" fill="#e0b25a" />
				<circle cx="120" cy="222" r="11.5" fill="none" stroke="#8a6320" strokeWidth="1.2" />
				<path d="M112 218h16v9h-16z M112 218l8 5.5 8-5.5" fill="none" stroke="#6b4a14" strokeWidth="1.4" strokeLinejoin="round" />

				{/* Slot band */}
				<rect x="50" y="150" width="140" height="44" fill="#000" opacity="0.12" />
				<rect x="70" y="176" width="100" height="10" rx="5" fill="#2a0306" />
				<rect x="66" y="168" width="108" height="9" rx="4.5" fill="#b3141d" />

				{/* Cap */}
				<rect x="44" y="130" width="152" height="24" rx="7" fill={`url(#cap-${id})`} />
				<path d="M52 132 C52 72 86 52 120 50 C154 52 188 72 188 132 Z" fill={`url(#cap-${id})`} />
				<path d="M70 118 C74 86 94 66 118 62" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="5" strokeLinecap="round" />
				<ellipse cx="120" cy="48" rx="12" ry="6" fill="#a8121a" />
				<ellipse cx="120" cy="46" rx="7" ry="3" fill="#f0474f" />
			</svg>

			{showMail &&
				floatingMail.map((mail) => (
					<motion.div
						key={mail.from}
						initial={{ opacity: 0, y: 16, scale: 0.94 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ type: "spring", stiffness: 180, damping: 18, delay: mail.delay }}
						className={cn("absolute z-20 hidden sm:block", mail.className)}
					>
						<motion.div
							animate={reduce ? undefined : { y: [0, -8, 0] }}
							transition={{ duration: 5 + mail.delay, repeat: Infinity, ease: "easeInOut" }}
							className="w-[210px] rounded-2xl border border-white/15 bg-white/10 p-3 text-left text-white shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
						>
							<div className="flex items-center gap-2">
								<span className="flex size-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-semibold">
									{mail.from.charAt(0)}
								</span>
								<span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{mail.from}</span>
								<span className="size-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
							</div>
							<p className="mt-1.5 truncate text-[12px] text-white/80">{mail.subject}</p>
							<span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-black/20 px-1.5 py-0.5 text-[10.5px] font-medium text-white/75">
								<span className={cn("size-1.5 rounded-full", mail.dot)} />
								{mail.domain}
							</span>
						</motion.div>
					</motion.div>
				))}
		</div>
	);
}

/** The deep enamel-red stage the illustration sits on. */
export function PillarBoxStage({ className, children }: { className?: string; children?: React.ReactNode }) {
	return (
		<div
			className={cn(
				"relative isolate overflow-hidden bg-[radial-gradient(120%_90%_at_75%_0%,#ef3f48_0%,#b3141d_38%,#5a070c_78%,#2a0306_100%)]",
				className,
			)}
		>
			<div
				aria-hidden
				className="absolute inset-0 -z-10 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_60%_at_50%_40%,black,transparent)]"
			/>
			<div aria-hidden className="absolute -bottom-32 left-1/2 -z-10 h-72 w-[140%] -translate-x-1/2 rounded-[100%] bg-black/40 blur-3xl" />
			{children}
		</div>
	);
}
