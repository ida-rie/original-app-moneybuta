'use client';

import type React from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useAutoRefreshOnResume } from '@/hooks/useAutoRefreshOnResume';
import {
	useUnifiedRefresh,
	type RefreshResult,
	type RefreshSource,
} from '@/hooks/useUnifiedRefresh';

type RefreshContextValue = {
	refreshAll: (source: RefreshSource) => Promise<RefreshResult>;
	isRefreshing: boolean;
	lastRefreshedAt: Date | null;
};

const RefreshContext = createContext<RefreshContextValue | null>(null);

type RefreshProviderProps = {
	children: React.ReactNode;
};

export const RefreshProvider = ({ children }: RefreshProviderProps) => {
	const { refreshAll, isRefreshing, lastRefreshedAt } = useUnifiedRefresh();

	useAutoRefreshOnResume({ refreshAll });

	const value = useMemo(
		() => ({
			refreshAll,
			isRefreshing,
			lastRefreshedAt,
		}),
		[isRefreshing, lastRefreshedAt, refreshAll]
	);

	return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
};

export const useRefreshContext = () => {
	const context = useContext(RefreshContext);
	if (!context) {
		throw new Error('useRefreshContext must be used within RefreshProvider');
	}
	return context;
};
