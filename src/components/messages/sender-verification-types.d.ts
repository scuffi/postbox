import type { SenderVerification } from "@/lib/email/sender-verification-types";

export type SenderVerificationProps = {
	verification?: SenderVerification | null;
	className?: string;
};

export type SenderAlert = {
	tone: "danger" | "caution";
	title: string;
	description: string;
};
