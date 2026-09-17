export type SignatureLayout = "classic" | "stacked" | "minimal";

export type SignatureDesign = {
	layout: SignatureLayout;
	name: string;
	title: string;
	company: string;
	phone: string;
	website: string;
	email: string;
	/** Absolute URL of an uploaded logo or headshot. */
	logoUrl: string;
	/** Hex colour used for the divider and links. */
	accent: string;
};

export type SignatureEditorMode = "design" | "edit" | "html";
