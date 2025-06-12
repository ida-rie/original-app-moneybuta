'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/zustand/authStore';

/**
 * クライアント起動時に sessionStorage から user 情報を復元し、
 * Zustand の isInitialized フラグを立てるコンポーネント
 */
const RestoreUserFromSession = () => {
	const setUser = useAuthStore((state) => state.setUser);
	const setIsInitialized = useAuthStore((state) => state.setIsInitialized);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const stored = sessionStorage.getItem('user');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setUser(parsed);
			} catch (error) {
				console.error('ユーザー情報の復元に失敗しました:', error);
			}
		}

		setIsInitialized(true);
	}, [setUser, setIsInitialized]);

	return null;
};

export default RestoreUserFromSession;
