import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { addDays, isBefore, startOfDay } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * クエスト履歴挿入用の型定義
 */
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

/**
 * BaseQuest情報マップ用型（リワード含む）
 */
type QuestInfo = {
	id: string;
	title: string;
	reward: number;
};

// ✅ 実際の親ユーザーID
const parentUserId = '87a5097e-0cac-4757-8741-827f2422f6fd';

// ✅ テスト用子ユーザーID一覧
const childUserIds = [
	'b65261b8-33ab-4199-92a5-c5ec891a0370',
	'ca4586ff-695a-4ca7-92ab-20f056717f85',
];

/**
 * 指定確率で真を返す
 * @param trueRatio - 真を返す確率 (0〜1)
 */
const getRandomBoolean = (trueRatio: number): boolean => Math.random() < trueRatio;

/**
 * 指定日付範囲内の日毎に QuestHistoryInsert レコードを生成する
 * @param baseQuestMap - childUserId ごとの BaseQuest 情報マップ
 * @param startDate - 範囲開始日 (JST 0:00)
 * @param endDate - 範囲終了日 (JST 0:00)
 */
const generateQuestHistories = (
	baseQuestMap: Record<string, QuestInfo[]>,
	startDate: Date,
	endDate: Date
): QuestHistoryInsert[] => {
	const data: QuestHistoryInsert[] = [];

	for (let day = new Date(startDate); !isBefore(endDate, day); day = addDays(day, 1)) {
		// UTC→JST 0:00→UTC
		const jstDayMidnight = startOfDay(utcToZonedTime(day, 'Asia/Tokyo'));
		const questDate = zonedTimeToUtc(jstDayMidnight, 'Asia/Tokyo');

		for (const childId of childUserIds) {
			const baseInfos = baseQuestMap[childId] ?? [];
			for (const { id: baseQuestId, title, reward } of baseInfos) {
				const completed = getRandomBoolean(0.8);
				const completedHour = completed ? Math.floor(Math.random() * 5) + 9 : 0;
				const completedAt = completed
					? zonedTimeToUtc(
							new Date(
								jstDayMidnight.getFullYear(),
								jstDayMidnight.getMonth(),
								jstDayMidnight.getDate(),
								completedHour
							),
							'Asia/Tokyo'
					  )
					: null;

				const approved = completed && getRandomBoolean(0.8);
				const approvedHour = approved
					? Math.min(completedHour + Math.floor(Math.random() * 4) + 1, 23)
					: 0;
				const approvedAt = approved
					? zonedTimeToUtc(
							new Date(
								jstDayMidnight.getFullYear(),
								jstDayMidnight.getMonth(),
								jstDayMidnight.getDate(),
								approvedHour
							),
							'Asia/Tokyo'
					  )
					: null;

				data.push({
					baseQuestId,
					childUserId: childId,
					title,
					reward, // BaseQuestに紐づく正しいrewardを使用
					completed,
					completedAt,
					completedBy: completed ? childId : null,
					approved,
					approvedAt,
					approvedBy: approved ? parentUserId : null,
					questDate,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}
	}

	return data;
};

// 実行用エントリポイント
const main = async () => {
	// BaseQuest テーブルから id, childUserId, title, reward を取得
	const { data: baseQuests, error } = await supabase
		.from('BaseQuest')
		.select('id, childUserId, title, reward');
	if (error || !baseQuests) {
		console.error('❌ BaseQuest の取得に失敗:', error?.message);
		process.exit(1);
	}

	// childUserId ごとにマップを生成
	const baseQuestMap: Record<string, QuestInfo[]> = {};
	for (const q of baseQuests) {
		(baseQuestMap[q.childUserId] ??= []).push({
			id: q.id,
			title: q.title,
			reward: q.reward,
		});
	}

	// テストデータ期間: 2025年5月6日〜2025年6月21日 (JST)
	const startDate = new Date(Date.UTC(2025, 4, 6));
	const endDate = new Date(Date.UTC(2025, 5, 21));

	const data = generateQuestHistories(baseQuestMap, startDate, endDate);

	const { error: insertError } = await supabase.from('QuestHistory').insert(data);
	if (insertError) {
		console.error('❌ QuestHistory の挿入に失敗:', insertError.message);
	} else {
		console.log(`✅ QuestHistory テストデータを ${data.length} 件挿入しました！`);
	}
};

main();
