import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, context: any) {
	try {
		const { id } = context.params;

		// 認証トークン取得
		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
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

		// クエストを承認状態にする
		const updated = await prisma.questHistory.update({
			where: { id },
			data: {
				approved: true,
				approvedAt: new Date(),
				approvedBy: user.id,
			},
		});

		return NextResponse.json({ message: 'クエストを承認しました', quest: updated });
	} catch (error) {
		console.error('クエスト承認エラー:', error);
		return NextResponse.json({ error: 'クエストの承認に失敗しました' }, { status: 500 });
	}
}
