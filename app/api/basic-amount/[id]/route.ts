import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// ここでしか使わないように！
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

// 基本金額の更新
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(req: NextRequest, context: any) {
	try {
		const { id } = context.params;
		const { basicAmount, month } = await req.json();

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

		const target = await prisma.basicAmount.findUnique({ where: { id } });
		if (!target || target.userId !== user.id) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(req: NextRequest, context: any) {
	try {
		const { id } = context.params;

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

		// 対象のbasicAmount取得
		const targetAmount = await prisma.basicAmount.findUnique({ where: { id } });

		if (!targetAmount) {
			return NextResponse.json({ error: '対象の基本金額が見つかりません' }, { status: 404 });
		}

		// 権限チェック（作成者＝親ユーザー）
		if (targetAmount.userId !== user.id) {
			return NextResponse.json({ error: '権限がありません' }, { status: 403 });
		}

		// 削除実行
		await prisma.basicAmount.delete({ where: { id } });

		return NextResponse.json({ message: '基本金額を削除しました' }, { status: 200 });
	} catch (error) {
		console.error('基本金額の削除エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
