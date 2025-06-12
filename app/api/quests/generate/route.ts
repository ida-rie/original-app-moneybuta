// app/api/quests/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns';

/** 既存履歴のキー情報 */
type ExistingHistory = {
	baseQuestId: string;
	childUserId: string;
};

/** base_quests から取得するフィールド */
type BaseQuestSelect = {
	id: string;
	childUserId: string;
	title: string;
	reward: number;
};

/** childUserId だけ取得するときの型 */
type ChildSelect = {
	childUserId: string;
};

/** QuestHistory.createMany 用のデータ型 */
type QuestHistoryCreateInput = {
	baseQuestId: string;
	childUserId: string;
	title: string;
	reward: number;
	completed: boolean;
	approved: boolean;
};

export async function POST(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);

		// クエリから子ID取得 (optional)
		const childParam: string | null = searchParams.get('childId');
		let targetChildIds: string[];

		if (childParam) {
			targetChildIds = [childParam];
		} else {
			// 全子アカウントIDを取得
			const allChildren: ChildSelect[] = await prisma.baseQuest.findMany({
				select: { childUserId: true },
			});
			targetChildIds = allChildren.map((c: ChildSelect) => c.childUserId);
		}

		// dateパラメータ取得・解析
		const dateParam: string | null = searchParams.get('date');
		const targetDate: Date = dateParam ? parseISO(dateParam) : new Date();

		if (!isValid(targetDate)) {
			return NextResponse.json({ error: 'dateパラメータが不正です' }, { status: 400 });
		}

		const start: Date = startOfDay(targetDate);
		const end: Date = endOfDay(targetDate);

		const toCreate: QuestHistoryCreateInput[] = [];

		// 子ごとに生成ロジック
		for (const childId of targetChildIds) {
			// その日の既存履歴を取得
			const existing: ExistingHistory[] = await prisma.questHistory.findMany({
				where: {
					childUserId: childId,
					createdAt: { gte: start, lte: end },
				},
				select: { baseQuestId: true, childUserId: true },
			});
			const existingSet: Set<string> = new Set(
				existing.map((h: ExistingHistory) => `${h.baseQuestId}_${h.childUserId}`)
			);

			// その子の base_quests を取得
			const baseQuests: BaseQuestSelect[] = await prisma.baseQuest.findMany({
				where: { childUserId: childId },
				select: {
					id: true,
					childUserId: true,
					title: true,
					reward: true,
				},
			});

			// 未生成分を toCreate に追加
			baseQuests.forEach((bq: BaseQuestSelect) => {
				const key = `${bq.id}_${bq.childUserId}`;
				if (!existingSet.has(key)) {
					toCreate.push({
						baseQuestId: bq.id,
						childUserId: bq.childUserId,
						title: bq.title,
						reward: bq.reward,
						completed: false,
						approved: false,
					});
				}
			});
		}

		if (toCreate.length === 0) {
			return NextResponse.json({
				message: `${dateParam ?? '今日'}のクエストはすでに生成済みです`,
			});
		}

		// 一括作成
		await prisma.questHistory.createMany({ data: toCreate });

		return NextResponse.json({
			message: `${dateParam ?? '今日'}のクエストを ${toCreate.length} 件生成しました`,
		});
	} catch (error) {
		console.error('クエスト履歴生成エラー:', error);
		return NextResponse.json({ error: 'クエスト履歴の生成に失敗しました' }, { status: 500 });
	}
}
