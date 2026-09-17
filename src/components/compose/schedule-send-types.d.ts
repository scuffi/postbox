export type ScheduleSendOption = {
	label: string;
	value: Date | null;
};

export type ScheduleSendMenuProps = {
	disabled?: boolean;
	value: Date | null;
	onChange: (value: Date | null) => void;
	/** `split` pairs with the desktop Send button; `icon` stands alone in the phone action bar. */
	variant?: "split" | "icon";
};
