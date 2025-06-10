// app/api/quests/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, isValid, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';

/** 既存履歴のキー */
type ExistingHistory = {
	baseQuestId: string;
	childUserId: string;
};

/** base_quests の必要フィールド */
type BaseQuestSelect = {
	id: string;
	childUserId: string;
	title: string;
	reward: number;
};

export const POST = async (req: NextRequest) => {
	try {
		// トークンを確認
		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		// Supabaseのセッションを取得
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		const { searchParams } = new URL(req.url);

		// ★ childId を必須パラメータに変更
		const childId = searchParams.get('childId');
		if (!childId) {
			return NextResponse.json({ error: 'childId が必要です' }, { status: 400 });
		}

		// オプションで targetDate を受け取れる
		const dateParam = searchParams.get('date');
		const targetDate = dateParam ? parseISO(dateParam) : new Date();
		if (!isValid(targetDate)) {
			return NextResponse.json({ error: 'dateパラメータが不正です' }, { status: 400 });
		}

		const start = startOfDay(targetDate);
		const end = endOfDay(targetDate);

		// ————————————————
		// 1) その子の既存履歴だけ取得
		// ————————————————
		const existing: ExistingHistory[] = await prisma.questHistory.findMany({
			where: {
				childUserId: childId,
				createdAt: { gte: start, lte: end },
			},
			select: { baseQuestId: true, childUserId: true },
		});
		const existingSet = new Set(existing.map((h) => `${h.baseQuestId}_${h.childUserId}`));

		// ————————————————
		// 2) その子の base_quests のみ取得
		// ————————————————
		const baseQuests: BaseQuestSelect[] = await prisma.baseQuest.findMany({
			where: { childUserId: childId },
			select: {
				id: true,
				childUserId: true,
				title: true,
				reward: true,
			},
		});

		// ————————————————
		// 3) 未生成分だけを抽出してペイロード作成
		// ————————————————
		const toCreate = baseQuests
			.filter((bq) => !existingSet.has(`${bq.id}_${bq.childUserId}`))
			.map((bq) => ({
				baseQuestId: bq.id,
				childUserId: bq.childUserId,
				title: bq.title,
				reward: bq.reward,
				completed: false,
				approved: false,
			}));

		if (toCreate.length === 0) {
			return NextResponse.json({
				message: `${dateParam ?? '今日'}のクエストはすでに生成済みです`,
			});
		}

		// ————————————————
		// 4) 一括生成
		// ————————————————
		await prisma.questHistory.createMany({ data: toCreate });

		return NextResponse.json({
			message: `${dateParam ?? '今日'}のクエストを ${toCreate.length} 件生成しました`,
		});
	} catch (error) {
		console.error('クエスト履歴生成エラー:', error);
		return NextResponse.json({ error: 'クエスト履歴の生成に失敗しました' }, { status: 500 });
	}
};
