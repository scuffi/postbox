"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { primeMessageDetail } from "@/lib/messages/detail-cache";
import type { Message } from "@/hooks/types";
import type { MessageNavigationState } from "./message-navigation-types";
import { NavigationProgressBar } from "@/components/components-nav";

export function useMessageNavigation(href: string, message: Message): MessageNavigationState {
	const pathname = usePathname();
	const router = useRouter();
	const [progress, setProgress] = useState<number | null>(null);

	useEffect(() => {
		if (progress === null) return;
		setProgress(100);
		const timer = window.setTimeout(() => setProgress(null), 220);
		return () => window.clearTimeout(timer);
	}, [pathname]);

	function onNavigate(event: MouseEvent<HTMLAnchorElement>, markRead = false) {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		primeMessageDetail({ ...message, read: markRead || message.read });
		setProgress(12);
		try {
			router.push(href);
		} catch {
			setProgress(null);
		}
	}

	return { progress, onNavigate };
}

export function MessageNavigationProgress({ progress }: { progress: number | null }) {
	return <NavigationProgressBar progress={progress} />;
}
