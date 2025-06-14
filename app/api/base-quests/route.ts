import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { BaseQuestType } from '@/types/baseQuestType';

// ここでしか使わないように！
const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);

// クエスト作成時の型定義
type BaseQuestItem = {
	title: string;
	reward: number;
};

export type BaseQuestCreateRequest = {
	quests: BaseQuestItem[];
	childUserId: string;
};

// 基本クエストの一覧を取得
export const GET = async (req: NextRequest) => {
	try {
		const { searchParams } = new URL(req.url);
		const childId = searchParams.get('childId');

		if (!childId) {
			return NextResponse.json({ error: 'childIdが必要です' }, { status: 400 });
		}

		const baseQuests: BaseQuestType[] = await prisma.baseQuest.findMany({
			where: {
				childUserId: childId,
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		if (!baseQuests || baseQuests.length === 0) {
			return NextResponse.json({ message: 'データが見つかりません', data: [] }, { status: 200 });
		}

		return NextResponse.json(baseQuests);
	} catch (error) {
		console.error('BaseQuest取得エラー:', error);
		return NextResponse.json({ error: 'クエスト一覧の取得に失敗しました' }, { status: 500 });
	}
};

// 基本クエストの新規作成
export async function POST(req: NextRequest) {
	try {
		const body: BaseQuestCreateRequest = await req.json();

		// 認証ヘッダーの取得
		const accessToken = req.headers.get('authorization')?.replace('Bearer ', '');
		if (!accessToken) {
			return NextResponse.json({ error: '認証情報がありません' }, { status: 401 });
		}

		// Supabaseからログインユーザーを取得
		const {
			data: { user },
			error: sessionError,
		} = await supabase.auth.getUser(accessToken);

		if (sessionError || !user) {
			return NextResponse.json({ error: '認証エラー' }, { status: 401 });
		}

		// 必要なデータの取得
		const { quests, childUserId } = body;

		if (!quests || !Array.isArray(quests) || !childUserId) {
			return NextResponse.json({ error: '不正なリクエスト形式です' }, { status: 400 });
		}

		// DB登録用に整形
		const createData = quests.map((quest) => ({
			title: quest.title,
			reward: quest.reward,
			childUserId,
			userId: user.id,
		}));

		const created = await prisma.baseQuest.createMany({
			data: createData,
		});

		return NextResponse.json(
			{ message: 'クエストを作成しました', count: created.count },
			{ status: 200 }
		);
	} catch (error) {
		console.error('クエスト作成エラー:', error);
		return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	}
}
