import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay } from 'date-fns';

export async function GET() {
	try {
		console.log('🚀 クエストの履歴自動生成 cron 開始:', new Date().toISOString());

		// ✅ 親ユーザー全取得（認証は問わず）
		const targetParents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: { id: true },
		});

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
				const baseQuests = await prisma.baseQuest.findMany({
					where: { userId: child.id },
				});

				for (const base of baseQuests) {
					const existing = await prisma.questHistory.findFirst({
						where: {
							baseQuestId: base.id,
							childUserId: child.id,
							questDate: startOfDay(today),
						},
					});

					if (existing) continue;

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
		console.log(`✅ 作成`);
		return NextResponse.json({ message: 'クエスト履歴を作成しました（認証なし）' });
	} catch (error) {
		console.error('クエスト履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
