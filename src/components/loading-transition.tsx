"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { useBranding } from "@/components/branding-provider";
import { BrandMark } from "@/components/brand/postbox-mark";
import { PageLoadingContext } from "@/components/page-loading";
import type { LoadingTransitionProps } from "./loading-transition-types";

const MINIMUM_LOADING_TIME = 400;
const COMPLETION_TIME = 220;
const MAXIMUM_DATA_WAIT = 10_000;

export function LoadingTransition({ children, ready }: LoadingTransitionProps) {
	const branding = useBranding();
	const startedAt = useRef(Date.now());
	const [progress, setProgress] = useState(8);
	const [loaderVisible, setLoaderVisible] = useState(true);
	const [contentVisible, setContentVisible] = useState(false);
	const [pageMounted, setPageMounted] = useState(false);
	const [pendingLoads, setPendingLoads] = useState(0);
	const [dataWaitExpired, setDataWaitExpired] = useState(false);
	const loadingIds = useRef(new Set<string>());
	const fetchingQueries = useIsFetching();

	const reportLoading = useCallback((id: string, loading: boolean) => {
		if (loading) loadingIds.current.add(id);
		else loadingIds.current.delete(id);
		setPendingLoads(loadingIds.current.size);
	}, []);
	const loadingContext = useMemo(() => ({ reportLoading }), [reportLoading]);
	const canComplete = ready && pageMounted && (dataWaitExpired || (pendingLoads === 0 && fetchingQueries === 0));

	useEffect(() => {
		if (canComplete) return;
		const timer = window.setInterval(() => {
			setProgress((current) => Math.min(92, current + Math.max(1, (92 - current) * 0.08)));
		}, 90);
		return () => window.clearInterval(timer);
	}, [canComplete]);

	useEffect(() => {
		if (!ready) return;
		const timer = window.setTimeout(() => setPageMounted(true), 50);
		return () => window.clearTimeout(timer);
	}, [ready]);

	useEffect(() => {
		if (!ready) return;
		const timer = window.setTimeout(() => setDataWaitExpired(true), MAXIMUM_DATA_WAIT);
		return () => window.clearTimeout(timer);
	}, [ready]);

	useEffect(() => {
		if (!canComplete) return;
		const remaining = Math.max(0, MINIMUM_LOADING_TIME - (Date.now() - startedAt.current));
		const completeTimer = window.setTimeout(() => setProgress(100), remaining);
		const revealTimer = window.setTimeout(() => {
			setLoaderVisible(false);
			setContentVisible(true);
		}, remaining + COMPLETION_TIME);
		return () => {
			window.clearTimeout(completeTimer);
			window.clearTimeout(revealTimer);
		};
	}, [canComplete]);

	return (
		<PageLoadingContext.Provider value={loadingContext}>
			<div className="relative min-h-dvh bg-canvas">
				{ready && (
					<div
						className={`min-h-dvh transition-[opacity,transform,filter] duration-500 ease-out ${contentVisible ? "scale-100 opacity-100 blur-0" : "scale-[0.995] opacity-0 blur-[2px]"}`}
					>
						{children}
					</div>
				)}
				<div
					aria-label="Loading"
					aria-live="polite"
					className={`fixed inset-0 z-[100] flex items-center justify-center bg-canvas transition-opacity duration-300 ${
						loaderVisible ? "opacity-100" : "pointer-events-none opacity-0"
					}`}
				>
					<div className="flex w-40 flex-col items-center gap-7">
						<div className="relative">
							<div className="absolute inset-0 -z-10 scale-[2.2] animate-pulse rounded-full bg-primary/15 blur-2xl" />
							<BrandMark className="size-14 rounded-2xl" />
						</div>
						<div className="h-[3px] w-full overflow-hidden rounded-full bg-border">
							<div
								className="h-full rounded-full bg-primary shadow-[0_0_12px_var(--primary)] transition-[width] duration-200 ease-out"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<span className="sr-only">{branding.appName}</span>
					</div>
				</div>
			</div>
		</PageLoadingContext.Provider>
	);
}
