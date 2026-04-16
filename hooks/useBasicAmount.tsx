'use client';

import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { BasicAmountType } from '@/types/basicAmountType';
import { apiJson } from '@/lib/client/apiClient';

// 基本金額データを取得するカスタムフック
export const useBasicAmount = () => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user?.id);
	const selectedChild = useAuthStore((state) => state.selectedChild?.id);

	const token =
		typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null;

	const shouldFetch = Boolean(selectedChild && user && token);

	const fetcher = async (url: string) => {
		const json = await apiJson<{ data: BasicAmountType | null }>(url);
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
