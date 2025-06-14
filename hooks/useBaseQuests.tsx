'use client';

import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { BaseQuestType } from '@/types/baseQuestType';

const fetcher = (url: string) =>
	fetch(url).then((res) => {
		if (!res.ok) throw new Error('基本クエスト取得失敗');
		return res.json();
	});

// BaseQuest一覧を取得するカスタムフック
export const useBaseQuests = () => {
	const { selectedChild } = useAuthStore();
	const childId = selectedChild?.id;

	const { data, error, isLoading, mutate } = useSWR<BaseQuestType[]>(
		childId ? `/api/base-quests?childId=${childId}` : null,
		fetcher
	);

	return {
		baseQuests: data ?? [],
		isLoading,
		error,
		mutate, // 一覧再取得に使える
	};
};
