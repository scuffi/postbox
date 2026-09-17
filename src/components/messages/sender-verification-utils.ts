import type { AuthMethodResult, SenderVerification } from "@/lib/email/sender-verification-types";
import type { SenderAlert } from "./sender-verification-types";

/** What the reader should be told before trusting the message, most serious first. */
export function getSenderAlerts(verification: SenderVerification | null | undefined): SenderAlert[] {
	if (!verification) return [];
	const alerts: SenderAlert[] = [];
	if (verification.status === "failed" && verification.fromDomain) {
		alerts.push({
			tone: "danger",
			title: "This sender could not be verified",
			description: `The message claims to be from ${verification.fromDomain}, but that domain's own checks say it didn't send it. Treat links, attachments and requests for money or passwords with suspicion.`,
		});
	}
	for (const warning of verification.warnings) {
		if (warning.kind === "lookalike_domain") {
			alerts.push({
				tone: "caution",
				title: "Lookalike domain",
				description: warning.own
					? `${warning.domain} looks like your own domain, ${warning.similarTo}, but isn't.`
					: `${warning.domain} looks like ${warning.similarTo}, which you've emailed before, but isn't.`,
			});
		} else {
			alerts.push({
				tone: "caution",
				title: "Misleading sender name",
				description: `The sender's name shows ${warning.claimed}, but the message came from a different address.`,
			});
		}
	}
	return alerts;
}

export function describeAuthResult(result: AuthMethodResult | null): { label: string; tone: "pass" | "fail" | "neutral" } {
	if (result === "pass") return { label: "Pass", tone: "pass" };
	if (result === "fail" || result === "softfail" || result === "permerror") return { label: result === "softfail" ? "Soft fail" : "Fail", tone: "fail" };
	if (!result || result === "none") return { label: "None", tone: "neutral" };
	return { label: result.charAt(0).toUpperCase() + result.slice(1), tone: "neutral" };
}
