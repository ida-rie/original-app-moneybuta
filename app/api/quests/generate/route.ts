import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function GET() {
	console.log('🟢 クエスト履歴作成バッチ開始');

	try {
		const today = startOfDay(new Date());

		const parents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: { id: true },
		});

		for (const parent of parents) {
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

				if (baseQuests.length === 0) {
					console.log(`⚠️ スキップ: 基本クエストなし childId=${child.id}`);
					continue;
				}

				let count = 0;

				for (const base of baseQuests) {
					const existing = await prisma.questHistory.findFirst({
						where: {
							baseQuestId: base.id,
							childUserId: child.id,
							questDate: today,
						},
					});

					if (existing) {
						await prisma.questHistory.update({
							where: { id: existing.id },
							data: {
								title: base.title,
								reward: base.reward,
							},
						});
					} else {
						await prisma.questHistory.create({
							data: {
								baseQuestId: base.id,
								childUserId: child.id,
								title: base.title,
								reward: base.reward,
								questDate: today,
							},
						});
					}

					count++;
				}

				console.log(`✅ 子 ${child.id}: ${count} 件のクエスト履歴を作成・更新`);
			}
		}

		console.log('✅ クエスト履歴作成バッチ正常終了');
		return NextResponse.json({ message: 'クエスト履歴作成完了' });
	} catch (error) {
		console.error('❌ クエスト履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
