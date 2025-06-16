import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format, startOfDay } from 'date-fns';

export async function GET() {
	try {
		console.log('🚀 金額の履歴自動生成 cron 開始:', new Date().toISOString());

		// ✅ 認証を完全スキップし、全親ユーザーを対象に処理
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
				// ✅ 基本金額取得（なければ0円扱い）
				const basicAmount = await prisma.basicAmount.findFirst({
					where: { userId: child.id },
					orderBy: { createdAt: 'desc' },
				});
				const base = basicAmount?.basicAmount ?? 0;

				// ✅ 今日のクエスト報酬合計を算出
				const todayApproved = await prisma.questHistory.findMany({
					where: {
						childUserId: child.id,
						approved: true,
						approvedAt: {
							gte: new Date(`${today}T00:00:00.000Z`),
							lte: new Date(`${today}T23:59:59.999Z`),
						},
					},
				});
				const rewardTotal = todayApproved.reduce((sum, q) => sum + q.reward, 0);

				// ✅ すでにAmountHistoryが存在するか確認
				const existing = await prisma.amountHistory.findFirst({
					where: {
						userId: parent.id,
						date: startOfDay(today),
					},
				});

				if (existing) {
					await prisma.amountHistory.update({
						where: { id: existing.id },
						data: {
							totalAmount: base + rewardTotal,
							childUserId: child.id,
							basicAmountId: basicAmount!.id ?? null,
						},
					});
				} else {
					await prisma.amountHistory.create({
						data: {
							userId: parent.id,
							childUserId: child.id,
							basicAmountId: basicAmount!.id ?? null,
							totalAmount: base + rewardTotal,
							date: startOfDay(today),
						},
					});
				}
			}
		}

		return NextResponse.json({ message: '金額履歴を作成しました（認証なし）' });
	} catch (error) {
		console.error('金額履歴作成エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
