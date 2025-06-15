import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

type QuestHistoryInsert = {
	baseQuestId: string;
	childUserId: string;
	title: string;
	reward: number;
	completed: boolean;
	completedAt: Date | null;
	completedBy: string | null;
	approved: boolean;
	approvedAt: Date | null;
	approvedBy: string | null;
	questDate: Date;
	createdAt: Date;
	updatedAt: Date;
};

type QuestInfo = {
	id: string;
	title: string;
};

// ✅ 正しいIDを使用
const parentUserId = '87a5097e-0cac-4757-8741-827f2422f6fd';

const childUserIds = [
	'b65261b8-33ab-4199-92a5-c5ec891a0370',
	'ca4586ff-695a-4ca7-92ab-20f056717f85',
];

// 指定した確率で true を返す関数
const getRandomBoolean = (trueRatio: number): boolean => {
	return Math.random() < trueRatio;
};

// 日付を生成する関数（JSは月が0始まり）
const getDate = (year: number, month: number, day: number): Date => {
	return new Date(year, month - 1, day);
};

// クエスト履歴を生成
const generateQuestHistories = (
	baseQuestMap: Record<string, QuestInfo[]>,
	startDate: Date,
	endDate: Date
) => {
	const data: QuestHistoryInsert[] = [];
	const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

	for (let i = 0; i < days; i++) {
		const questDate = new Date(startDate);
		questDate.setDate(startDate.getDate() + i);

		for (const childId of childUserIds) {
			const baseQuestInfos = baseQuestMap[childId] || [];
			for (const { id: baseQuestId, title } of baseQuestInfos) {
				const completed = getRandomBoolean(0.8);
				const approved = completed ? getRandomBoolean(0.8) : false;

				data.push({
					baseQuestId,
					childUserId: childId,
					title,
					reward: 100,
					completed,
					completedAt: completed ? questDate : null,
					completedBy: completed ? childId : null,
					approved,
					approvedAt: approved ? new Date(questDate.getTime() + 86400000) : null,
					approvedBy: approved ? parentUserId : null,
					questDate,
					createdAt: questDate,
					updatedAt: new Date(),
				});
			}
		}
	}

	return data;
};

// 実行用関数
const main = async () => {
	const { data: baseQuests, error } = await supabase
		.from('BaseQuest')
		.select('id, childUserId, title');

	if (error || !baseQuests) {
		console.error('❌ BaseQuestの取得に失敗:', error?.message);
		process.exit(1);
	}

	const baseQuestMap: Record<string, QuestInfo[]> = {};
	for (const quest of baseQuests) {
		if (!baseQuestMap[quest.childUserId]) {
			baseQuestMap[quest.childUserId] = [];
		}
		baseQuestMap[quest.childUserId].push({ id: quest.id, title: quest.title });
	}

	const startDate = getDate(2025, 5, 6); // ✅ 5月6日から
	const endDate = getDate(2025, 6, 14); // ✅ 6月14日まで
	const data = generateQuestHistories(baseQuestMap, startDate, endDate);

	const { error: insertError } = await supabase.from('QuestHistory').insert(data);

	if (insertError) {
		console.error('❌ データ挿入に失敗:', insertError.message);
	} else {
		console.log(`✅ QuestHistory テストデータを ${data.length} 件挿入しました！`);
	}
};

main();
