import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { isPushFeatureEnabled } from '@/lib/server/push/feature';

export const dynamic = 'force-dynamic';
const MAX_SUBSCRIPTIONS_PER_USER = 5;

type PushSubscriptionInput = {
	endpoint?: string;
	expirationTime?: number | null;
	keys?: {
		p256dh?: string;
		auth?: string;
	};
};

const isValidSubscription = (input: PushSubscriptionInput) => {
	return !!(input.endpoint && input.keys?.p256dh && input.keys?.auth);
};

const isValidEndpoint = (endpoint: string) => {
	try {
		const url = new URL(endpoint);
		return url.protocol === 'https:' && endpoint.length <= 2048;
	} catch {
		return false;
	}
};

export async function GET(req: NextRequest) {
	try {
		if (!isPushFeatureEnabled()) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const subscriptions = await prisma.webPushSubscription.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				endpoint: true,
				expirationTime: true,
				createdAt: true,
			},
		});

		return NextResponse.json({
			count: subscriptions.length,
			subscriptions,
		});
	} catch (error) {
		console.error('Push購読取得エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		if (!isPushFeatureEnabled()) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const body = (await req.json()) as { subscription?: PushSubscriptionInput };
		const subscription = body.subscription;

		if (!subscription || !isValidSubscription(subscription)) {
			return NextResponse.json({ error: '購読情報が不正です' }, { status: 400 });
		}
		if (!isValidEndpoint(subscription.endpoint!)) {
			return NextResponse.json({ error: 'endpoint が不正です' }, { status: 400 });
		}

		const currentCount = await prisma.webPushSubscription.count({
			where: { userId: user.id },
		});
		const existing = await prisma.webPushSubscription.findUnique({
			where: { endpoint: subscription.endpoint! },
			select: { id: true },
		});
		if (!existing && currentCount >= MAX_SUBSCRIPTIONS_PER_USER) {
			return NextResponse.json(
				{ error: `購読上限に達しています（最大 ${MAX_SUBSCRIPTIONS_PER_USER} 件）` },
				{ status: 429 }
			);
		}

		const saved = await prisma.webPushSubscription.upsert({
			where: { endpoint: subscription.endpoint! },
			create: {
				userId: user.id,
				endpoint: subscription.endpoint!,
				p256dh: subscription.keys!.p256dh!,
				auth: subscription.keys!.auth!,
				expirationTime:
					typeof subscription.expirationTime === 'number'
						? new Date(subscription.expirationTime)
						: null,
				userAgent: req.headers.get('user-agent') ?? null,
			},
			update: {
				userId: user.id,
				p256dh: subscription.keys!.p256dh!,
				auth: subscription.keys!.auth!,
				expirationTime:
					typeof subscription.expirationTime === 'number'
						? new Date(subscription.expirationTime)
						: null,
				userAgent: req.headers.get('user-agent') ?? null,
			},
		});

		return NextResponse.json({
			message: '購読を保存しました',
			subscriptionId: saved.id,
		});
	} catch (error) {
		console.error('Push購読保存エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest) {
	try {
		if (!isPushFeatureEnabled()) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
		const endpoint = typeof body.endpoint === 'string' ? body.endpoint : null;

		if (endpoint) {
			const deleted = await prisma.webPushSubscription.deleteMany({
				where: {
					userId: user.id,
					endpoint,
				},
			});

			return NextResponse.json({
				message: '購読を解除しました',
				deletedCount: deleted.count,
			});
		}

		const deletedAll = await prisma.webPushSubscription.deleteMany({
			where: { userId: user.id },
		});

		return NextResponse.json({
			message: '購読をすべて解除しました',
			deletedCount: deletedAll.count,
		});
	} catch (error) {
		console.error('Push購読解除エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
