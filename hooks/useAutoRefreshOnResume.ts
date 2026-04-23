'use client';

import { useEffect, useRef } from 'react';
import type { RefreshSource } from '@/hooks/useUnifiedRefresh';

type UseAutoRefreshOnResumeParams = {
	refreshAll: (source: RefreshSource) => Promise<'updated' | 'skipped'>;
	minIntervalMs?: number;
};

export const useAutoRefreshOnResume = ({
	refreshAll,
	minIntervalMs = 5000,
}: UseAutoRefreshOnResumeParams) => {
	const lastResumeRefreshAt = useRef(0);

	useEffect(() => {
		const triggerResumeRefresh = () => {
			if (document.visibilityState !== 'visible') return;

			const now = Date.now();
			if (now - lastResumeRefreshAt.current < minIntervalMs) return;

			lastResumeRefreshAt.current = now;
			void refreshAll('resume').catch((error) => {
				console.error('復帰時の更新に失敗しました:', error);
			});
		};

		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				triggerResumeRefresh();
			}
		};

		window.addEventListener('focus', triggerResumeRefresh);
		window.addEventListener('pageshow', triggerResumeRefresh);
		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			window.removeEventListener('focus', triggerResumeRefresh);
			window.removeEventListener('pageshow', triggerResumeRefresh);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [minIntervalMs, refreshAll]);
};
