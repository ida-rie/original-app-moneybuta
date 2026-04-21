'use client';

// import React, { useEffect } from 'react';
import React from 'react';
import { Swords } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useQuestList } from '@/hooks/useQuestList';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import QuestCard from '@/components/quest/QuestCard';

const QuestPage = () => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);
	const { quests, loading } = useQuestList();

	// 子アカウント未選択
	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-8 text-center text-base">子どもアカウントを選択してください</p>;
	}

	// 読み込み中
	if (loading) {
		return (
			<div className="p-4 max-w-2xl mx-auto">
				<MainTitle title="おてつだいクエスト" icon={Swords} />
				<div className="space-y-4 animate-pulse">
					<div className="h-[120px] rounded-xl bg-gray-200" />
					<div className="h-[120px] rounded-xl bg-gray-200" />
					<div className="h-[120px] rounded-xl bg-gray-200" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 max-w-2xl mx-auto">
			{/* 共通見出し */}
			<MainTitle title="おてつだいクエスト" icon={Swords} />

			{/* クエスト一覧は親子共通 */}
			{quests.length === 0 ? (
				<p className="mt-8 text-center text-base">きょうはまだクエストがありません。</p>
			) : (
				<QuestCard user={user!} />
			)}
		</div>
	);
};

export default QuestPage;
