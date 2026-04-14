import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
import { prisma } from '@/lib/prisma';
import { utcToZonedTime } from 'date-fns-tz';

export const dynamic = 'force-dynamic';

// 基本金額の取得
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		// トークン取得
		const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
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

		// 該当のBasicAmountを取得（今月分。なければ直近の月を返す）
		const basicAmount = await prisma.basicAmount.findFirst({
			where: {
				childUserId: childId,
				userId: user.id,
			},
			orderBy: {
				month: 'desc',
			},
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

		const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');
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

		// 現在の年月を JST で生成（例: 2025-06）
		// UTC のまま計算すると JST 0〜8 時台に前月扱いになるため JST に変換する
		const nowJst = utcToZonedTime(new Date(), 'Asia/Tokyo');
		const monthDate = `${nowJst.getFullYear()}-${String(nowJst.getMonth() + 1).padStart(2, '0')}`;

		const upserted = await prisma.basicAmount.upsert({
			where: {
				childUserId_month: { childUserId, month: monthDate },
			},
			create: {
				userId: user.id,
				childUserId,
				basicAmount,
				month: monthDate,
			},
			update: {
				basicAmount,
			},
		});

		return NextResponse.json(upserted, { status: 201 });
	} catch (error) {
		console.error('基本金額の作成エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
