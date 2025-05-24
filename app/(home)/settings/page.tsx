'use client';

import { Settings, ClipboardCheck, ReceiptJapaneseYen } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import SubTitle from '@/components/layout/header/headline/SubTitle';
import QuestCreateForm from '@/components/settings/QuestCreateForm';
import QuestListEditor from '@/components/settings/QuestListEditor';
import BasicAmountEditor from '@/components/settings/BasicAmountEditor';

// テストデータ
const QuestLists = [
	{ id: 1, title: 'せんたくをする', amount: 50 },
	{ id: 2, title: 'かたづけをする', amount: 30 },
	{ id: 3, title: 'あらいものをする', amount: 100 },
];

const BasicAmount = { amount: 500 };

const Setting = () => {
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
					{QuestLists.map((quest) => (
						<QuestListEditor key={quest.id} quest={quest} />
					))}
				</div>
				{/* クエストの新規設定 */}
				<div>
					<p className="text-lg pl-2 border-l-4 border-[var(--color-accent)] mb-4">新規設定</p>
					<QuestCreateForm />
				</div>
			</div>

			<div>
				<SubTitle title="基本金額の設定" icon={ReceiptJapaneseYen} />
				<div>
					<BasicAmountEditor basicAmount={BasicAmount} />
				</div>
			</div>
		</>
	);
};

export default Setting;
