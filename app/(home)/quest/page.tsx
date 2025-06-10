'use client';

import React, { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useQuestList } from '@/hooks/useQuestList';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import QuestCard from '@/components/quest/QuestCard';
import { Button } from '@/components/ui/button';

const QuestPage = () => {
	const { user, selectedChild } = useAuthStore();
	const { quests, loading, fetchQuests } = useQuestList();
	const [isGenerating, setIsGenerating] = useState(false);

	// 初回ロード／生成後に一覧取得
	useEffect(() => {
		fetchQuests();
	}, [fetchQuests]);

	const handleGenerate = async () => {
		setIsGenerating(true);
		const token = sessionStorage.getItem('access_token');
		const childId = selectedChild?.id;
		const res = await fetch(`/api/quests/generate?childId=${childId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});
		const json = await res.json();
		if (!res.ok) {
			toast.error('クエストの作成に失敗しました');
			console.error(json.error);
		} else {
			toast.success('クエストを作成しました');
			await fetchQuests();
		}
		setIsGenerating(false);
	};

	// 子アカウント未選択 or 読み込み中
	if (!selectedChild) {
		return <p className="mt-8 text-center">子どもアカウントを選択してください</p>;
	}
	if (loading) {
		return <p className="mt-8 text-center">よみこみ中…</p>;
	}

	return (
		<div className="p-4 max-w-2xl mx-auto">
			{/* 共通見出し */}
			<MainTitle title="おてつだいクエスト" icon={Swords} />

			{/* 親権限の操作エリア */}
			{user?.role === 'parent' && (
				<div className="my-4 p-4 bg-gray-50 rounded-lg text-center">
					<Button variant="primary" onClick={handleGenerate} disabled={isGenerating}>
						{isGenerating ? '作成中…' : '今日のクエストを作成'}
					</Button>
					<p className="mt-2 text-sm text-gray-600">
						{quests.length === 0
							? 'ボタンを押すと、今日のクエストが作成されます。'
							: '今日のクエストは作成済みです。'}
					</p>
				</div>
			)}

			{/* クエスト一覧は親子共通 */}
			{quests.length === 0 ? (
				<p className="mt-8 text-center text-gray-500">
					{/* 親はメッセージ非表示にしてOK */}
					{user?.role === 'parent'
						? 'まだクエストがありません。上のボタンで作成してください。'
						: 'きょうはまだクエストがありません。あしたをおたのしみに！'}
				</p>
			) : (
				<QuestCard user={user!} />
			)}
		</div>
	);
};

export default QuestPage;
