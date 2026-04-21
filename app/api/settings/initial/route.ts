import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { canAccessChild } from '@/lib/server/childAccess';
import { logApiPerf } from '@/lib/server/perf';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	const startedAt = Date.now();
	let authAt = startedAt;
	let authzAt = startedAt;
	let dbAt = startedAt;

	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		const { user, errorResponse } = await requireAuth(req);
		authAt = Date.now();
		if (errorResponse) return errorResponse;

		const [baseQuests, basicAmount] = await Promise.all([
			prisma.baseQuest.findMany({
				where: {
					childUserId: childId,
					childUser: {
						role: 'child',
						OR: [{ id: user.id }, { parentId: user.id }],
					},
				},
				orderBy: { createdAt: 'desc' },
			}),
			prisma.basicAmount.findFirst({
				where: {
					childUserId: childId,
					userId: user.id,
					childUser: {
						role: 'child',
						OR: [{ id: user.id }, { parentId: user.id }],
					},
				},
				orderBy: { month: 'desc' },
			}),
		]);
		authzAt = Date.now();
		dbAt = Date.now();

		if (baseQuests.length === 0 && !basicAmount) {
			const hasAccess = await canAccessChild(user, childId);
			dbAt = Date.now();
			if (!hasAccess) {
				return NextResponse.json({ error: '権限がありません' }, { status: 403 });
			}
		}

		logApiPerf('GET /api/settings/initial', {
			authMs: authAt - startedAt,
			authzMs: authzAt - authAt,
			dbMs: dbAt - authzAt,
			totalMs: dbAt - startedAt,
		});

		return NextResponse.json({
			baseQuests,
			basicAmount: basicAmount ?? null,
		});
	} catch (error) {
		console.error('設定初期データ取得エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
