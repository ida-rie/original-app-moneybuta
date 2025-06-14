'use client';

import { Settings, ClipboardCheck, ReceiptJapaneseYen } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import SubTitle from '@/components/layout/header/headline/SubTitle';
import QuestCreateForm from '@/components/settings/QuestCreateForm';
import QuestListEditor from '@/components/settings/QuestListEditor';
import BasicAmountEditor from '@/components/settings/BasicAmountEditor';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useBaseQuests } from '@/hooks/useBaseQuests';
import { useBasicAmount } from '@/hooks/useBasicAmount';

const Setting = () => {
	const { baseQuests, isLoading: loadingQuests, mutate: mutateBaseQuests } = useBaseQuests();
	const { basicAmount, isLoading: loadingAmount, mutate: mutateBasicAmount } = useBasicAmount();

	const { user } = useAuthStore();

	if (!user || user.role !== 'parent') {
		return <p>このページは親ユーザーのみ閲覧可能です。</p>;
	}

	// 読み込み中
	if (loadingQuests || loadingAmount) {
		return <p className="mt-8 text-center">よみこみ中…</p>;
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
