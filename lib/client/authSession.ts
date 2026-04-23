'use client';

import { Session } from '@supabase/supabase-js';

export const syncSessionCookie = async (session: Session) => {
	const res = await fetch('/api/auth/session', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include',
		body: JSON.stringify({
			accessToken: session.access_token,
			refreshToken: session.refresh_token,
		}),
	});

	if (!res.ok) {
		throw new Error('セッションCookieの保存に失敗しました');
	}
};

export const clearSessionCookie = async () => {
	await fetch('/api/auth/signout', {
		method: 'POST',
		credentials: 'include',
	});
};
