import type { ReactNode } from "react";

export type PullToRefreshProps = {
	/** Runs once the pull is released past the threshold; the spinner holds until it settles. */
	onRefresh(): Promise<unknown>;
	disabled?: boolean;
	/** Classes for the scroll container, which this component renders. */
	className?: string;
	children: ReactNode;
};
