'use client';

// import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { QuestType } from '@/types/questType';
import { apiJson } from '@/lib/client/apiClient';

// クエスト一覧を取得するカスタムフック
const fetcher = (url: string) => apiJson<QuestType[]>(url);

export const useQuestList = () => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	const childId = selectedChild?.id || (user?.role === 'child' ? user.id : null);

	const shouldFetch = !!childId;
	const { data, isLoading, mutate, error } = useSWR<QuestType[]>(
		shouldFetch ? `/api/quests?childId=${childId}` : null,
		fetcher,
		{
			revalidateOnFocus: false, // フォーカス時の再検証を無効化
			revalidateOnReconnect: false, // 再接続時の再検証を無効化
		}
	);

	return {
		quests: data ?? [],
		loading: isLoading,
		mutateQuests: mutate,
		error,
	};
};
