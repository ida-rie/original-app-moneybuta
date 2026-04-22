import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { getAuthorizedQuestForApproval } from '@/lib/server/resourceAccess';
import { getTodayUtc } from '@/lib/utils/getTodayUtc';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		const { user, errorResponse } = await requireAuth(req, {
			authErrorMessage: 'ユーザー認証に失敗しました',
		});
		if (errorResponse) return errorResponse;

		const { quest, status, error } = await getAuthorizedQuestForApproval(id, user);
		if (!quest) {
			return NextResponse.json({ error }, { status: status! });
		}
		if (!quest.completed) {
			return NextResponse.json(
				{ error: '完了済みのクエストのみ承認できます' },
				{ status: 409 }
			);
		}
		if (quest.approved) {
			return NextResponse.json({ error: 'すでに承認済みです' }, { status: 409 });
		}

		// 状態遷移条件を where に含め、同時更新競合を検知する
		const result = await prisma.questHistory.updateMany({
			where: { id, completed: true, approved: false },
			data: { approved: true, approvedAt: new Date(), approvedBy: user.id },
		});
		if (result.count === 0) {
			return NextResponse.json(
				{ error: 'クエスト状態が更新されたため承認できませんでした' },
				{ status: 409 }
			);
		}
		const updated = await prisma.questHistory.findUnique({ where: { id } });
		if (!updated) {
			return NextResponse.json({ error: 'クエストが見つかりません' }, { status: 404 });
		}

		return NextResponse.json({ message: 'クエストを承認しました', quest: updated });
	} catch (error) {
		console.error('クエスト承認エラー:', error);
		return NextResponse.json({ error: 'クエストの承認に失敗しました' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		const { user, errorResponse } = await requireAuth(req, {
			authErrorMessage: 'ユーザー認証に失敗しました',
		});
		if (errorResponse) return errorResponse;

		const { quest, status, error } = await getAuthorizedQuestForApproval(id, user);
		if (!quest) {
			return NextResponse.json({ error }, { status: status! });
		}
		if (!quest.approved) {
			return NextResponse.json({ error: '未承認のクエストは解除できません' }, { status: 409 });
		}
		if (!quest.approvedAt) {
			return NextResponse.json(
				{ error: '承認日時が不正なため解除できません' },
				{ status: 409 }
			);
		}

		const { start, end } = getTodayUtc();
		if (quest.approvedAt < start || quest.approvedAt > end) {
			return NextResponse.json(
				{ error: '承認解除は当日中のみ可能です' },
				{ status: 409 }
			);
		}

		// 当日中の承認のみ取り消し可能にして整合性を保つ
		const result = await prisma.questHistory.updateMany({
			where: {
				id,
				approved: true,
				approvedAt: {
					gte: start,
					lte: end,
				},
			},
			data: {
				approved: false,
				approvedAt: null,
				approvedBy: null,
			},
		});
		if (result.count === 0) {
			return NextResponse.json(
				{ error: 'クエスト状態が更新されたため承認解除できませんでした' },
				{ status: 409 }
			);
		}
		const updated = await prisma.questHistory.findUnique({ where: { id } });
		if (!updated) {
			return NextResponse.json({ error: 'クエストが見つかりません' }, { status: 404 });
		}

		return NextResponse.json({ message: 'クエスト承認を解除しました', quest: updated });
	} catch (error) {
		console.error('クエスト承認解除エラー:', error);
		return NextResponse.json({ error: 'クエスト承認の解除に失敗しました' }, { status: 500 });
	}
}
