import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/server/requireAuth';
import { hasWebPushConfig, sendWebPushNotification } from '@/lib/server/push/webPush';
import { isPushFeatureEnabled, isPushTestEndpointEnabled } from '@/lib/server/push/feature';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	try {
		if (!isPushFeatureEnabled() || !isPushTestEndpointEnabled()) {
			return NextResponse.json({ error: 'Not Found' }, { status: 404 });
		}

		const { user, errorResponse } = await requireAuth(req);
		if (errorResponse) return errorResponse;

		if (!hasWebPushConfig()) {
			return NextResponse.json(
				{ error: 'VAPID 設定が未構成です。環境変数を設定してください。' },
				{ status: 503 }
			);
		}

		const subscriptions = await prisma.webPushSubscription.findMany({
			where: { userId: user.id },
		});

		if (subscriptions.length === 0) {
			return NextResponse.json({ error: '購読デバイスがありません' }, { status: 404 });
		}

		let sent = 0;
		let failed = 0;
		const staleEndpoints: string[] = [];

		for (const sub of subscriptions) {
			try {
				await sendWebPushNotification(
					{
						endpoint: sub.endpoint,
						expirationTime: sub.expirationTime ? sub.expirationTime.getTime() : null,
						keys: {
							p256dh: sub.p256dh,
							auth: sub.auth,
						},
					},
					{
						title: 'マネぶた',
						body: 'テスト通知です。通知設定は正常です。',
						url: '/mypage',
						icon: '/pwa/icon-192.png',
					}
				);
				sent += 1;
			} catch (error: unknown) {
				failed += 1;
				const statusCode =
					typeof error === 'object' && error !== null && 'statusCode' in error
						? Number((error as { statusCode?: number }).statusCode)
						: null;

				if (statusCode === 404 || statusCode === 410) {
					staleEndpoints.push(sub.endpoint);
				}
			}
		}

		if (staleEndpoints.length > 0) {
			await prisma.webPushSubscription.deleteMany({
				where: {
					endpoint: { in: staleEndpoints },
				},
			});
		}

		return NextResponse.json({
			sent,
			failed,
			removedStale: staleEndpoints.length,
		});
	} catch (error) {
		console.error('Pushテスト送信エラー:', error);
		return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
	}
}
