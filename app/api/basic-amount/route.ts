import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

// ここでしか使わないように！
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

// 基本金額の取得
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		// トークン取得
		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		// ユーザー取得
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		// 該当のBasicAmountを取得（最新の1件）
		const basicAmount = await prisma.basicAmount.findFirst({
			where: {
				childUserId: childId,
				userId: user.id,
			},
			// orderBy: {
			// 	createdAt: 'desc',
			// },
		});

		if (!basicAmount) {
			return NextResponse.json({ message: 'データが見つかりません', data: null }, { status: 200 });
		}

		return NextResponse.json({ data: basicAmount }, { status: 200 });
	} catch (error) {
		console.error('基本金額の取得エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}

// 基本金額の作成
export async function POST(req: NextRequest) {
	try {
		const { childUserId, basicAmount } = await req.json();

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

		// 現在の年月（例: 2025-06）を文字列で生成
		const now = new Date();
		const monthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

		const created = await prisma.basicAmount.create({
			data: {
				userId: user.id,
				childUserId,
				basicAmount,
				month: monthDate,
			},
		});

		return NextResponse.json(created, { status: 201 });
	} catch (error) {
		console.error('基本金額の作成エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
