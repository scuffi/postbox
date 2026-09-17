import { ChevronRight } from "lucide-react";
import type { PreviousMessageProps } from "./previous-message-types";

export function PreviousMessage({ message }: PreviousMessageProps) {
	return (
		<details className="group mt-4 border-l-2 border-border-strong pl-4">
			<summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
				<ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" />
				<span>
					Previous message {message.direction} at {message.dateLine}
				</span>
			</summary>
			<div className="pb-2 pl-5 text-muted-foreground">
				{message.content && (
					<pre className="whitespace-pre-wrap text-sm font-sans">
						{message.content}
					</pre>
				)}
				{message.quotedContent.map((nestedMessage, index) => (
					<PreviousMessage
						key={`${nestedMessage.dateLine}-${nestedMessage.content.slice(0, 24)}-${index}`}
						message={nestedMessage}
					/>
				))}
			</div>
		</details>
	);
}
