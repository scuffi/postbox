export type AuthMethodResult = "pass" | "fail" | "softfail" | "neutral" | "none" | "temperror" | "permerror" | "policy";

export type AuthenticationResults = {
	dmarc: AuthMethodResult | null;
	/** Domain DMARC evaluated (`header.from`). */
	dmarcDomain: string | null;
	/** The From domain's published policy (`policy.dmarc`): none, quarantine or reject. */
	dmarcPolicy: string | null;
	dkim: AuthMethodResult | null;
	/** Signing domain of the passing DKIM signature, or of the first one seen. */
	dkimDomain: string | null;
	spf: AuthMethodResult | null;
	spfDomain: string | null;
};

/**
 * - `verified`: the From domain itself vouched for the message (aligned DMARC or DKIM pass).
 * - `failed`: the From domain's policy says this message did not come from it.
 * - `unknown`: not enough evidence either way (no results, or the domain publishes nothing).
 */
export type SenderVerificationStatus = "verified" | "failed" | "unknown";

export type SenderWarning =
	| { kind: "lookalike_domain"; domain: string; similarTo: string; own: boolean }
	| { kind: "display_name_address"; claimed: string };

export type SenderVerification = {
	status: SenderVerificationStatus;
	fromDomain: string | null;
	results: AuthenticationResults | null;
	warnings: SenderWarning[];
};
