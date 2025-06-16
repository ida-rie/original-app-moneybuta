import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function GET() {
	console.log('🟢 金額履歴作成バッチ開始');

	try {
		// 日本時間での「今日」の開始時刻（UTC 0時 → JST 9時補正不要）
		const todayStart = startOfDay(new Date());

		// 全親ユーザーを取得
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
				// 基本金額取得（なければスキップ）
				const basicAmount = await prisma.basicAmount.findFirst({
					where: { userId: child.id },
					orderBy: { createdAt: 'desc' },
				});
				if (!basicAmount) continue;

				const baseAmountValue = basicAmount.basicAmount;

				// 今日承認されたクエスト報酬合計
				const todayApproved = await prisma.questHistory.findMany({
					where: {
						childUserId: child.id,
						approved: true,
						approvedAt: {
							gte: new Date(`${todayStart.toISOString().slice(0, 10)}T00:00:00.000Z`),
							lte: new Date(`${todayStart.toISOString().slice(0, 10)}T23:59:59.999Z`),
						},
					},
				});
				const rewardTotal = todayApproved.reduce((sum, q) => sum + q.reward, 0);
				const totalAmount = baseAmountValue + rewardTotal;

				// 既存履歴があれば update、なければ create
				const existing = await prisma.amountHistory.findFirst({
					where: {
						userId: parent.id,
						date: todayStart,
					},
				});

				if (existing) {
					await prisma.amountHistory.update({
						where: { id: existing.id },
						data: {
							totalAmount,
							childUserId: child.id,
							basicAmountId: basicAmount.id,
						},
					});
				} else {
					await prisma.amountHistory.create({
						data: {
							userId: parent.id,
							childUserId: child.id,
							basicAmountId: basicAmount.id,
							totalAmount,
							date: todayStart,
						},
					});
				}
			}
		}

		console.log('✅ 金額履歴作成バッチ正常終了');
		return NextResponse.json({ message: '金額履歴作成完了' });
	} catch (error) {
		console.error('❌ 金額履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
