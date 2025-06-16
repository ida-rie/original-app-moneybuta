import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function GET() {
	try {
		console.log('🚀 金額の履歴自動生成 cron 開始:', new Date().toISOString());

		// ✅ 認証を完全スキップし、全親ユーザーを対象に処理
		const targetParents = await prisma.user.findMany({
			where: { role: 'parent' },
			select: { id: true },
		});

		const todayStart = startOfDay(new Date());

		for (const parent of targetParents) {
			const children = await prisma.user.findMany({
				where: {
					parentId: parent.id,
					role: 'child',
				},
				select: { id: true },
			});

			for (const child of children) {
				const basicAmount = await prisma.basicAmount.findFirst({
					where: { userId: child.id },
					orderBy: { createdAt: 'desc' },
				});
				const base = basicAmount?.basicAmount ?? 0;

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

				const existing = await prisma.amountHistory.findFirst({
					where: {
						userId: parent.id,
						date: todayStart,
					},
				});

				if (existing) {
					const updated = await prisma.amountHistory.update({
						where: { id: existing.id },
						data: {
							totalAmount: base + rewardTotal,
							childUserId: child.id,
							basicAmountId: basicAmount!.id ?? null,
						},
					});
					console.log(`🔄 更新: ${parent.id} / ${child.id}`, updated);
				} else {
					const created = await prisma.amountHistory.create({
						data: {
							userId: parent.id,
							childUserId: child.id,
							basicAmountId: basicAmount!.id ?? null,
							totalAmount: base + rewardTotal,
							date: todayStart,
						},
					});
					console.log(`✅ 作成: ${parent.id} / ${child.id}`, created);
				}
			}
		}

		return NextResponse.json({ message: '金額履歴を作成しました（認証なし）' });
	} catch (error) {
		console.error('金額履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
