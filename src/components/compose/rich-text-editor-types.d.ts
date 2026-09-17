export type RichTextEditorProps = {
	id: string;
	/** Editable HTML. */
	value: string;
	onChange: (html: string) => void;
	/** Quoted or forwarded HTML shown folded under the editable area. */
	quotedHtml?: string | null;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
	toolbarStart?: React.ReactNode;
	toolbarEnd?: React.ReactNode;
	/** Hides the formatting row; the phone composer toggles it from its action bar. */
	toolbarHidden?: boolean;
};

export type ToolbarCommand = {
	command: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	value?: string;
};
