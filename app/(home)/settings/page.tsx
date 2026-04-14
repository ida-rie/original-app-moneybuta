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
import { useBaseQuests } from '@/hooks/useBaseQuests';
import { useBasicAmount } from '@/hooks/useBasicAmount';
import { toast } from 'sonner';

const Setting = () => {
	const router = useRouter();
	const { baseQuests, loadingQuests, mutateBaseQuests } = useBaseQuests();
	const { basicAmount, loadingAmount, amountError, mutateBasicAmount, amountReady } =
		useBasicAmount();

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
	if (loadingQuests || (amountReady && loadingAmount)) {
		return (
			<div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
				<p className="text-xl font-semibold">よみこみ中...</p>
			</div>
		);
	}

	if (amountError) {
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
							<QuestListEditor key={quest.id} quest={quest} mutate={mutateBaseQuests} />
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
					<QuestCreateForm mutate={mutateBaseQuests} />
				</div>
			</div>

			<div className="mb-10">
				<SubTitle title="基本金額の設定" icon={ReceiptJapaneseYen} />
				<div>
					<BasicAmountEditor basicAmount={basicAmount ?? null} mutate={mutateBasicAmount} />
				</div>
			</div>
		</>
	);
};

export default Setting;
