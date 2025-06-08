'use client';
import { useAuthStore } from '@/lib/zustand/authStore';
import { QuestType } from '@/types/questType';
import { useCallback, useEffect, useState } from 'react';

// クエストの状態を再レンダリングさせるため、カスタムフックを作成
export const useQuestList = () => {
	const [quests, setQuests] = useState<QuestType[]>([]);
	const [loading, setLoading] = useState(true);
	const { selectedChild } = useAuthStore();

	const fetchQuests = useCallback(async () => {
		if (!selectedChild) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/quests?childId=${selectedChild.id}`);
			const data = await res.json();
			setQuests(data);
		} catch (error) {
			console.error('クエスト取得エラー:', error);
		} finally {
			setLoading(false);
		}
	}, [selectedChild]);

	useEffect(() => {
		fetchQuests();
	}, [fetchQuests]);

	return { quests, loading, fetchQuests };
};
