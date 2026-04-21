'use client';

import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { BaseQuestType } from '@/types/baseQuestType';
import { BasicAmountType } from '@/types/basicAmountType';
import { apiJson } from '@/lib/client/apiClient';

type SettingsInitialResponse = {
	baseQuests: BaseQuestType[];
	basicAmount: BasicAmountType | null;
};

const fetcher = (url: string) => apiJson<SettingsInitialResponse>(url);

export const useSettingsInitial = () => {
	const selectedChild = useAuthStore((state) => state.selectedChild);
	const childId = selectedChild?.id;

	const { data, error, isLoading, mutate } = useSWR<SettingsInitialResponse>(
		childId ? `/api/settings/initial?childId=${childId}` : null,
		fetcher,
		{
			revalidateOnFocus: false,
			revalidateOnReconnect: false,
			keepPreviousData: true,
		}
	);

	const refetch = async () => {
		await mutate();
	};

	return {
		baseQuests: data?.baseQuests ?? [],
		basicAmount: data?.basicAmount ?? null,
		loading: isLoading,
		error,
		refetch,
	};
};

