"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { clearMailboxClientState } from "@/components/mailbox-provider-utils";
import { BrandingProvider } from "@/components/branding-provider";
import { NewMessagePopup } from "@/components/new-message-popup";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "motion/react";
import { useMessagePolling } from "@/hooks/use-message-polling";
import { clearMessageClientState } from "@/hooks/utils";
import { clearMessageDetailCache } from "@/lib/messages/detail-cache";
import { AUTH_SESSION_CHANGED_EVENT } from "@/lib/auth/client";

export function Providers({ children }: { children: React.ReactNode }) {
	const realtime = useMessagePolling();

	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						refetchOnMount: false,
						refetchOnReconnect: false,
						refetchOnWindowFocus: false,
						staleTime: 60_000,
					},
				},
			}),
	);

	useEffect(() => {
		function resetUserScopedState() {
			client.clear();
			clearMailboxClientState();
			clearMessageClientState();
			clearMessageDetailCache();
		}

		window.addEventListener(AUTH_SESSION_CHANGED_EVENT, resetUserScopedState);
		return () => window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, resetUserScopedState);
	}, [client]);

	return (
		<QueryClientProvider client={client}>
			<ThemeProvider>
				<TooltipProvider delayDuration={350} skipDelayDuration={150}>
					<BrandingProvider>
						{children}
						<AnimatePresence>
							{realtime.notification && (
								<NewMessagePopup
									key={realtime.notification.messageId}
									notification={realtime.notification}
									onDismiss={realtime.dismissNotification}
								/>
							)}
						</AnimatePresence>
						<Toaster />
					</BrandingProvider>
				</TooltipProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
