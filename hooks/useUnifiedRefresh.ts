'use client';

import { useCallback, useRef, useState } from 'react';
import { useSWRConfig } from 'swr';

export type RefreshSource = 'manual' | 'pull' | 'resume';
export type RefreshResult = 'updated' | 'skipped';

const REFRESHABLE_KEY_PREFIXES = [
	'/api/quests',
	'/api/amount/monthly',
	'/api/basic-amount',
	'/api/base-quests',
	'/api/settings/initial',
] as const;

const isRefreshableKey = (key: unknown) => {
	if (typeof key !== 'string') return false;
	return REFRESHABLE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
};

const REFRESH_COOLDOWN_MS = 1500;

export const useUnifiedRefresh = () => {
	const { mutate: globalMutate } = useSWRConfig();
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
	const lastTriggeredAtRef = useRef(0);
	const isRefreshingRef = useRef(false);

	const refreshAll = useCallback(
		async (source: RefreshSource): Promise<RefreshResult> => {
			void source;
			const now = Date.now();
			if (isRefreshingRef.current) return 'skipped';
			if (now - lastTriggeredAtRef.current < REFRESH_COOLDOWN_MS) return 'skipped';

			lastTriggeredAtRef.current = now;
			isRefreshingRef.current = true;
			setIsRefreshing(true);

			try {
				await globalMutate(isRefreshableKey, undefined, { revalidate: true });
				setLastRefreshedAt(new Date(now));
				return 'updated';
			} finally {
				isRefreshingRef.current = false;
				setIsRefreshing(false);
			}
		},
		[globalMutate]
	);

	return {
		refreshAll,
		isRefreshing,
		lastRefreshedAt,
	};
};
