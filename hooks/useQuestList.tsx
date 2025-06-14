'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/zustand/authStore';
import { QuestType } from '@/types/questType';

// クエスト一覧を取得するカスタムフック
export const useQuestList = () => {
	const { selectedChild, user } = useAuthStore();
	const [quests, setQuests] = useState<QuestType[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchQuests = useCallback(async () => {
		const childId = selectedChild?.id || (user?.role === 'child' ? user.id : null);
		if (!childId) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const res = await fetch(`/api/quests?childId=${childId}`);
			if (!res.ok) {
				throw new Error('クエスト取得失敗');
			}
			const data = await res.json();
			console.log('data', data);
			setQuests(data);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [selectedChild, user]);

	useEffect(() => {
		fetchQuests();
	}, [fetchQuests, user]);

	return { quests, fetchQuests, loading };
};
