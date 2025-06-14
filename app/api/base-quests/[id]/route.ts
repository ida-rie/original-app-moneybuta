import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// ここでしか使わないように！
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

type UpdateBaseQuestRequest = {
	title?: string;
	reward?: number;
	childUserId?: string;
};

// 基本クエストの更新
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, context: any) {
	try {
		const { id } = context.params;
		const body: UpdateBaseQuestRequest = await req.json();

		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		// クエストが存在するか確認
		const existingQuest = await prisma.baseQuest.findUnique({ where: { id } });
		if (!existingQuest) {
			return NextResponse.json({ error: 'クエストが存在しません' }, { status: 404 });
		}

		// ログインユーザーがこのクエストの親か確認
		if (existingQuest.userId !== user.id) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		// 更新処理
		const updatedQuest = await prisma.baseQuest.update({
			where: { id },
			data: {
				...(body.title && { title: body.title }),
				...(body.reward !== undefined && { reward: body.reward }),
				...(body.childUserId && { childUserId: body.childUserId }),
			},
		});

		return NextResponse.json(updatedQuest, { status: 200 });
	} catch (error) {
		console.error('基本クエスト更新エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

// 基本クエストの削除
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
	try {
		const { id } = context.params;

		// 認証トークン取得
		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		// Supabaseユーザー取得
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		// 削除対象の基本クエスト取得
		const baseQuest = await prisma.baseQuest.findUnique({
			where: { id },
		});

		if (!baseQuest) {
			return NextResponse.json({ error: 'クエストが見つかりません' }, { status: 404 });
		}

		// 自身のクエストかチェック
		if (baseQuest.userId !== user.id) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		// ① 関連履歴を先に削除
		await prisma.questHistory.deleteMany({
			where: { baseQuestId: id },
		});

		// ② 基本クエストを削除
		await prisma.baseQuest.delete({
			where: { id },
		});

		return NextResponse.json({ message: 'クエストを削除しました' }, { status: 200 });
	} catch (error) {
		console.error('基本クエスト削除エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
