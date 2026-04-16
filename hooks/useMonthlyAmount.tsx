'use client';

import useSWR from 'swr';
import { MonthlyAmountType } from '@/types/MonthlyAmountType';
import { apiJson } from '@/lib/client/apiClient';

// 認証ヘッダー付きfetcher（月別金額APIはトークン必須）
const fetcher = (url: string) => {
	return apiJson<MonthlyAmountType>(url, {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

/**
 * 月別おこづかい金額を取得するカスタムフック
 * 同一の childId + month の組み合わせで複数コンポーネントが呼び出しても
 * SWR のキャッシュにより API リクエストは1回に自動集約される
 */
export const useMonthlyAmount = (
	childId: string | null | undefined,
	month: string
) => {
	const key = childId ? `/api/amount/monthly?childId=${childId}&month=${month}` : null;

	const { data, isLoading, error, mutate } = useSWR<MonthlyAmountType>(key, fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: false,
	});

	return {
		data,
		isLoading,
		error,
		mutate,
	};
};
