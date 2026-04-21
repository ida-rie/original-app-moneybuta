'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, ClipboardCheck, ReceiptJapaneseYen } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import SubTitle from '@/components/layout/header/headline/SubTitle';
import QuestCreateForm from '@/components/settings/QuestCreateForm';
import QuestListEditor from '@/components/settings/QuestListEditor';
import BasicAmountEditor from '@/components/settings/BasicAmountEditor';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useSettingsInitial } from '@/hooks/useSettingsInitial';
import { toast } from 'sonner';

const Setting = () => {
	const router = useRouter();
	const { baseQuests, basicAmount, loading, error, refetch } = useSettingsInitial();

	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	// 子ロールのアクセス制限: ストア復元後に role チェックしてリダイレクト
	useEffect(() => {
		if (!isInitialized) return;
		if (!user || user.role !== 'parent') {
			router.replace('/quest');
		}
	}, [isInitialized, user, router]);

	// ストア未初期化 or 子ロールは何も描画しない（リダイレクト待ち）
	if (!isInitialized || !user || user.role !== 'parent') {
		return null;
	}

	// 子アカウント未選択
	if (user?.role === 'parent' && !selectedChild) {
		return <p className="mt-8 text-center text-base">子どもアカウントを選択してください</p>;
	}

	// 読み込み中
	if (loading) {
		return (
			<div className="animate-pulse space-y-6">
				<MainTitle title="各種設定" icon={Settings} />
				<div className="h-6 w-48 bg-gray-200 rounded" />
				<div className="h-24 w-full bg-gray-200 rounded" />
				<div className="h-24 w-full bg-gray-200 rounded" />
				<div className="h-24 w-full bg-gray-200 rounded" />
			</div>
		);
	}

	if (error) {
		toast('基本金額の取得に失敗しました');
		return;
	}

	return (
		<>
			<MainTitle title="各種設定" icon={Settings} />

			<div className="mb-10">
				<SubTitle title="お手伝いクエストの設定" icon={ClipboardCheck} />
				{/* 設定済みクエストの表示・編集 */}
				<div className="mb-10">
					<p className="text-lg pl-2 border-l-4 border-[var(--color-accent)] mb-4">
						設定済みクエストの一覧
					</p>
					{baseQuests.length > 0 ? (
						baseQuests.map((quest) => (
							<QuestListEditor key={quest.id} quest={quest} mutate={refetch} />
						))
					) : (
						<p>設定済みクエストがありません。</p>
					)}
				</div>
				{/* クエストの新規設定 */}
				<div>
					<p className="text-lg pl-2 border-l-4 border-[var(--color-accent)] mb-4">
						クエストの新規設定
					</p>
					<QuestCreateForm mutate={refetch} />
				</div>
			</div>

			<div className="mb-10">
				<SubTitle title="基本金額の設定" icon={ReceiptJapaneseYen} />
				<div>
					<BasicAmountEditor basicAmount={basicAmount ?? null} mutate={refetch} />
				</div>
			</div>
		</>
	);
};

export default Setting;
