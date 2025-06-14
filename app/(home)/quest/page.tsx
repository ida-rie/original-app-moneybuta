'use client';

import React, { useEffect } from 'react';
import { Swords } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useQuestList } from '@/hooks/useQuestList';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import QuestCard from '@/components/quest/QuestCard';

const QuestPage = () => {
	const { user, selectedChild } = useAuthStore();
	const { quests, loading, fetchQuests } = useQuestList();

	// 初回ロード／作成後に一覧取得
	useEffect(() => {
		if (selectedChild) {
			fetchQuests();
		}
	}, [selectedChild, fetchQuests]);

	// 子アカウント未選択
	if (!selectedChild && user?.role === 'parent') {
		return <p className="mt-8 text-center">子どもアカウントを選択してください</p>;
	}

	// 読み込み中
	if (loading) {
		return <p className="mt-8 text-center">よみこみ中…</p>;
	}

	return (
		<div className="p-4 max-w-2xl mx-auto">
			{/* 共通見出し */}
			<MainTitle title="おてつだいクエスト" icon={Swords} />

			{/* クエスト一覧は親子共通 */}
			{quests.length === 0 ? (
				<p className="mt-8 text-center text-gray-500">きょうはまだクエストがありません。</p>
			) : (
				<QuestCard user={user!} />
			)}
		</div>
	);
};

export default QuestPage;
