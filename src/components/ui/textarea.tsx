import * as React from "react";
import { cn } from "@/lib/utils";
import { inputClassName } from "./input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
	({ className, ...props }, ref) => (
		<textarea
			className={cn(inputClassName, "h-auto min-h-[88px] py-2 leading-relaxed", className)}
			ref={ref}
			{...props}
		/>
	),
);
Textarea.displayName = "Textarea";
