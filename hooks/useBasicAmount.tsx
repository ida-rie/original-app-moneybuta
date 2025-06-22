'use client';

import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { BasicAmountType } from '@/types/basicAmountType';

// 基本金額データを取得するカスタムフック
export const useBasicAmount = () => {
	// const { selectedChild, user } = useAuthStore();
	// 必要な state のみを取得（プリミティブ値にする）
	const selectedChild = useAuthStore((state) => state.selectedChild?.id);
	const user = useAuthStore((state) => state.user?.id);
	const token = sessionStorage.getItem('access_token');

	const shouldFetch = Boolean(selectedChild && user && token);

	const fetcher = async (url: string) => {
		// トークンがなければスキップ
		if (!token) return null;

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

	const { data, error, isValidating, mutate } = useSWR(
		shouldFetch ? `/api/basic-amount?childId=${selectedChild}` : null,
		fetcher,
		{
			revalidateOnFocus: false, // フォーカス時の再検証を無効化
			revalidateOnReconnect: false, // 再接続時の再検証を無効化
			keepPreviousData: true, // 前回データを保持して、キー切り替えのたびにローディングしない
		}
	);

	return {
		basicAmount: data,
		loadingAmount: shouldFetch && isValidating && data === undefined,
		amountError: error,
		mutateBasicAmount: mutate,
		amountReady: shouldFetch,
	};
};
