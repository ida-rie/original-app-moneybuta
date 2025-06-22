'use client';

// import React, { useEffect } from 'react';
import React from 'react';
import { Swords } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useQuestList } from '@/hooks/useQuestList';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import QuestCard from '@/components/quest/QuestCard';

const QuestPage = () => {
	const { user, selectedChild } = useAuthStore();
	// const { quests, loading, mutateQuests } = useQuestList();
	const { quests, loading } = useQuestList();

	// 初回ロード／作成後に一覧取得
	// useEffect(() => {
	// 	if (selectedChild) {
	// 		mutateQuests(); // SWRのキャッシュを再取得
	// 	}
	// }, [selectedChild, mutateQuests]);

	// 子アカウント未選択
	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-8 text-center text-base">子どもアカウントを選択してください</p>;
	}

	// 読み込み中
	if (loading) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
				<p className="text-xl font-semibold">よみこみ中...</p>
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
