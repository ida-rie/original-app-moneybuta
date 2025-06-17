'use client';

// import { useEffect, useState, useCallback } from 'react';
import useSWR from 'swr';
import { useAuthStore } from '@/lib/zustand/authStore';
import { QuestType } from '@/types/questType';

// クエスト一覧を取得するカスタムフック
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useQuestList = () => {
	const { selectedChild, user } = useAuthStore();

	const childId = selectedChild?.id || (user?.role === 'child' ? user.id : null);

	const shouldFetch = !!childId;
	const { data, isLoading, mutate, error } = useSWR<QuestType[]>(
		shouldFetch ? `/api/quests?childId=${childId}` : null,
		fetcher
	);

	return {
		quests: data ?? [],
		loading: isLoading,
		mutateQuests: mutate,
		error,
	};
};
