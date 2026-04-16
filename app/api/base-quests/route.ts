import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BaseQuestType } from '@/types/baseQuestType';
import { getTodayUtc } from '@/lib/utils/getTodayUtc';
import { requireAuth } from '@/lib/server/requireAuth';
import { canAccessChild, canManageChildAsParent } from '@/lib/server/childAccess';

export const dynamic = 'force-dynamic';

// クエスト作成時の型定義
type BaseQuestItem = {
	title: string;
	reward: number;
};

export type BaseQuestCreateRequest = {
	quests: BaseQuestItem[];
	childUserId: string;
};

// 基本クエストの一覧を取得
export const GET = async (req: NextRequest) => {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const hasAccess = await canAccessChild(user, childId);
		if (!hasAccess) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		const baseQuests: BaseQuestType[] = await prisma.baseQuest.findMany({
			where: {
				childUserId: childId,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		if (!baseQuests || baseQuests.length === 0) {
			return NextResponse.json({ message: 'データが見つかりません', data: [] }, { status: 200 });
		}

		return NextResponse.json(baseQuests);
	} catch (error) {
		console.error('BaseQuest取得エラー:', error);
		return NextResponse.json({ error: 'クエスト一覧の取得に失敗しました' }, { status: 500 });
	}
};

// 基本クエストの新規作成（当日分の履歴も作成）
export async function POST(req: NextRequest) {
	try {
		const body: BaseQuestCreateRequest = await req.json();

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const { quests, childUserId } = body;

		if (!quests || !Array.isArray(quests) || !childUserId) {
			return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
		}

		const hasAccess = await canManageChildAsParent(user, childUserId);
		if (!hasAccess) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		const { start: todayStart } = getTodayUtc();

		let createdCount = 0;

		for (const quest of quests) {
			const base = await prisma.baseQuest.create({
				data: {
					title: quest.title,
					reward: quest.reward,
					childUserId,
					userId: user.id,
				},
			});

			await prisma.questHistory.upsert({
				where: {
					baseQuestId_childUserId_questDate: {
						baseQuestId: base.id,
						childUserId,
						questDate: todayStart,
					},
				},
				create: {
					baseQuestId: base.id,
					childUserId,
					title: base.title,
					reward: base.reward,
					completed: false,
					approved: false,
					questDate: todayStart,
				},
				update: {},
			});

			createdCount++;
		}

		return NextResponse.json(
			{ message: 'クエストを作成しました', count: createdCount },
			{ status: 200 }
		);
	} catch (error) {
		console.error('クエスト作成エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
