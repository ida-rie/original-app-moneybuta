import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

export async function GET(req: NextRequest) {
	try {
		const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');

		let targetParents: { id: string }[] = [];

		// ✅ 手動実行時：認証された親ユーザーのみ対象
		if (accessToken) {
			const {
				data: { user },
				error,
			} = await supabase.auth.getUser(accessToken);

			if (error || !user) {
				return NextResponse.json({ error: '認証エラー' }, { status: 401 });
			}

			targetParents = [{ id: user.id }];
		} else {
			// ✅ cron実行時：全親ユーザー対象
			targetParents = await prisma.user.findMany({
				where: { role: 'parent' },
				select: { id: true },
			});
		}

		const today = format(new Date(), 'yyyy-MM-dd');

		for (const parent of targetParents) {
			const children = await prisma.user.findMany({
				where: {
					parentId: parent.id,
					role: 'child',
				},
				select: { id: true },
			});

			for (const child of children) {
				// ✅ この子に紐づく全てのBaseQuestを取得
				const baseQuests = await prisma.baseQuest.findMany({
					where: { userId: child.id },
				});

				for (const base of baseQuests) {
					// ✅ すでに今日の履歴があるか確認
					const existing = await prisma.questHistory.findFirst({
						where: {
							baseQuestId: base.id,
							childUserId: child.id,
							questDate: startOfDay(today),
						},
					});

					if (existing) continue; // ✅ 重複を防ぐためスキップ

					await prisma.questHistory.create({
						data: {
							baseQuestId: base.id,
							childUserId: child.id,
							title: base.title,
							reward: base.reward,
							completed: false,
							approved: false,
							questDate: startOfDay(today),
						},
					});
				}
			}
		}

		return NextResponse.json({ message: 'クエスト履歴を作成しました' });
	} catch (error) {
		console.error('クエスト履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
