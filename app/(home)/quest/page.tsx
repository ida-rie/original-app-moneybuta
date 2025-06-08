'use client';

import { useAuthStore } from '@/lib/zustand/authStore';
import { Swords } from 'lucide-react';
import QuestCard from '@/components/quest/QuestCard';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import { useQuestList } from '@/hooks/useQuestList';

const Quest = () => {
	const { user, selectedChild } = useAuthStore();
	const { quests, loading } = useQuestList();

	if (!selectedChild) {
		return <p>子どもアカウントを選択してください</p>;
	}

	if (loading) {
		return <p>読み込み中...</p>;
	}

	if (quests.length === 0) {
		return <p>クエストがありません</p>;
	}
	return (
		<>
			{/* 見出し */}
			<MainTitle title="おてつだいクエスト" icon={Swords} />
			{/* クエストの表示 */}
			<QuestCard user={user!} />
		</>
	);
};

export default Quest;
