import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { getAuthorizedBasicAmount } from '@/lib/server/resourceAccess';

export const dynamic = 'force-dynamic';

// 基本金額の更新
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const { basicAmount, month } = await req.json();

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const { basicAmount: target, status, error } = await getAuthorizedBasicAmount(id, user);
		if (!target) {
			return NextResponse.json({ error }, { status: status! });
		}

		const updated = await prisma.basicAmount.update({
			where: { id },
			data: {
				basicAmount,
				month,
			},
		});

		return NextResponse.json(updated, { status: 200 });
	} catch (error) {
		console.error('基本金額の更新エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const { basicAmount: targetAmount, status, error } = await getAuthorizedBasicAmount(id, user);
		if (!targetAmount) {
			return NextResponse.json({ error }, { status: status! });
		}

		// 削除実行
		await prisma.basicAmount.delete({ where: { id } });

		return NextResponse.json({ message: '基本金額を削除しました' }, { status: 200 });
	} catch (error) {
		console.error('基本金額の削除エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
