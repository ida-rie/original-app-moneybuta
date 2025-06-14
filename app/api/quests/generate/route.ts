// app/api/quests/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, isValid, startOfDay } from 'date-fns';

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
	questDate: Date;
};

export default async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);

		// クエリから子ID取得 (optional)
		const childParam: string | null = searchParams.get('childId');
		let targetChildIds: string[];

		if (childParam) {
			targetChildIds = [childParam];
		} else {
			const allChildren: ChildSelect[] = await prisma.baseQuest.findMany({
				select: { childUserId: true },
				distinct: ['childUserId'], // 重複除去
			});
			targetChildIds = allChildren.map((c: ChildSelect) => c.childUserId);
		}

		// dateパラメータ取得・解析
		const dateParam: string | null = searchParams.get('date');
		const targetDate: Date = dateParam ? parseISO(dateParam) : new Date();
		const questDate = startOfDay(targetDate); // 正規化

		if (!isValid(targetDate)) {
			return NextResponse.json({ error: 'dateパラメータが不正です' }, { status: 400 });
		}

		const toCreate: QuestHistoryCreateInput[] = [];

		for (const childId of targetChildIds) {
			// 既存履歴取得
			const existing: ExistingHistory[] = await prisma.questHistory.findMany({
				where: {
					childUserId: childId,
					questDate,
				},
				select: { baseQuestId: true, childUserId: true },
			});
			const existingSet: Set<string> = new Set(
				existing.map((h: ExistingHistory) => `${h.baseQuestId}_${h.childUserId}`)
			);

			// 対象 base_quests を取得
			const baseQuests: BaseQuestSelect[] = await prisma.baseQuest.findMany({
				where: { childUserId: childId },
				select: {
					id: true,
					childUserId: true,
					title: true,
					reward: true,
				},
			});

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
						questDate,
					});
				}
			});
		}

		if (toCreate.length === 0) {
			return NextResponse.json({
				message: `${dateParam ?? '今日'}のクエストはすでに作成済みです`,
			});
		}

		await prisma.questHistory.createMany({ data: toCreate });

		return NextResponse.json({
			message: `${dateParam ?? '今日'}のクエストを ${toCreate.length} 件作成しました`,
		});
	} catch (error) {
		console.error('クエスト履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
	}
}
