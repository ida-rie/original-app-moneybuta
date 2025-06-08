import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

// ① 型定義
type ExistingHistoryKey = {
	baseQuestId: string;
	childUserId: string;
};

type BaseQuestRecord = {
	id: string;
	childUserId: string;
	title: string;
	reward: number;
};

export const POST = async () => {
	try {
		const today = new Date();
		const start = startOfDay(today);
		const end = endOfDay(today);

		// ② 今日作成済みのクエスト履歴（最小限の情報だけ取得）
		const existingHistories: ExistingHistoryKey[] = await prisma.questHistory.findMany({
			where: {
				createdAt: {
					gte: start,
					lte: end,
				},
			},
			select: {
				baseQuestId: true,
				childUserId: true,
			},
		});

		// ③ 重複判定のキーセットを作成
		const existingKeySet = new Set<string>(
			existingHistories.map((h: ExistingHistoryKey) => `${h.baseQuestId}_${h.childUserId}`)
		);

		// ④ base_quests 全件取得（実際の型は Prisma が補完）
		const baseQuests = await prisma.baseQuest.findMany();

		// ⑤ 今日未作成のものをフィルタして履歴を作成
		const newHistories = baseQuests
			.filter((bq: BaseQuestRecord) => !existingKeySet.has(`${bq.id}_${bq.childUserId}`))
			.map((bq: BaseQuestRecord) => ({
				baseQuestId: bq.id,
				childUserId: bq.childUserId,
				title: bq.title,
				reward: bq.reward,
				completed: false,
				approved: false,
			}));

		if (newHistories.length === 0) {
			return NextResponse.json({ message: '今日のクエストはすでに作成済みです' });
		}

		await prisma.questHistory.createMany({ data: newHistories });

		return NextResponse.json({
			message: '今日のクエスト履歴を作成しました',
			count: newHistories.length,
		});
	} catch (error) {
		console.error('クエスト履歴生成エラー:', error);
		return NextResponse.json({ error: 'クエスト履歴の生成に失敗しました' }, { status: 500 });
	}
};
