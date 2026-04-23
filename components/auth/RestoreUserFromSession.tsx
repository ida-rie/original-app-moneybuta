'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/zustand/authStore';

/**
 * クライアント起動時に cookie 認証から user 情報を復元し、
 * Zustand の isInitialized フラグを立てるコンポーネント。
 */
const RestoreUserFromSession = () => {
	const setUserAndInitialize = useAuthStore((state) => state.setUserAndInitialize);
	const setIsInitialized = useAuthStore((state) => state.setIsInitialized);
	const clearUser = useAuthStore((state) => state.clearUser);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		let active = true;

		const restore = async () => {
			try {
				let res = await fetch('/api/auth/me', { credentials: 'include' });
				if (res.status === 401) {
					const refreshed = await fetch('/api/auth/refresh', {
						method: 'POST',
						credentials: 'include',
					});
					if (refreshed.ok) {
						res = await fetch('/api/auth/me', { credentials: 'include' });
					}
				}
				if (!active) return;

				if (!res.ok) {
					clearUser();
					setIsInitialized(true);
					return;
				}

				const userInfo = await res.json();
				if (!active) return;
				setUserAndInitialize({
					id: userInfo.id,
					email: userInfo.email,
					loginId: userInfo.loginId,
					name: userInfo.name,
					role: userInfo.role,
					iconUrl: userInfo.iconUrl,
					children: userInfo.role === 'parent' ? userInfo.children ?? [] : undefined,
				});
			} catch (error) {
				console.error('認証復元エラー:', error);
				if (!active) return;
				clearUser();
				setIsInitialized(true);
			}
		};
		void restore();

		return () => {
			active = false;
		};
	}, [setUserAndInitialize, setIsInitialized, clearUser]);

	return null;
};

export default RestoreUserFromSession;
