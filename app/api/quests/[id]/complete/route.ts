import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// クエスト完了API（子が「やったよ」を押す）
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;

		// 認証トークン取得
		const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		// Supabaseでユーザー取得
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser(accessToken);

		if (authError || !user) {
			return NextResponse.json({ error: 'ユーザー認証に失敗しました' }, { status: 401 });
		}

		// クエストを取得して権限チェック
		const quest = await prisma.questHistory.findUnique({ where: { id } });
		if (!quest) {
			return NextResponse.json({ error: 'クエストが見つかりません' }, { status: 404 });
		}
		if (quest.childUserId !== user.id) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		// クエストを完了状態にする
		const updated = await prisma.questHistory.update({
			where: { id },
			data: {
				completed: true,
				completedAt: new Date(),
				completedBy: user.id,
			},
		});

		return NextResponse.json({ message: 'クエストを完了しました', quest: updated });
	} catch (error) {
		console.error('クエスト完了エラー:', error);
		return NextResponse.json({ error: 'クエストの完了に失敗しました' }, { status: 500 });
	}
}
