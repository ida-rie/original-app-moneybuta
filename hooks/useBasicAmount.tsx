'use client';

import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { BasicAmountType } from '@/types/basicAmountType';

// 基本金額データを取得するカスタムフック
export const useBasicAmount = () => {
	const { selectedChild, user } = useAuthStore();

	const shouldFetch = user && selectedChild;

	const fetcher = async (url: string) => {
		const token = sessionStorage.getItem('access_token');
		const res = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			throw new Error('基本金額の取得に失敗しました');
		}

		const json = await res.json();
		return json.data as BasicAmountType | null;
	};

	const { data, error, isLoading, mutate } = useSWR(
		shouldFetch ? `/api/basic-amount?childId=${selectedChild?.id}` : null,
		fetcher
	);

	return {
		basicAmount: data,
		isLoading,
		error,
		mutate,
	};
};
