'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/zustand/authStore';
import { supabase } from '@/lib/supabase';

/**
 * クライアント起動時に sessionStorage から user 情報を復元し、
 * Zustand の isInitialized フラグを立てるコンポーネント。
 * また、Supabase のトークン自動更新を監視し、
 * Cookie と sessionStorage を最新のトークンに差し替える。
 */
const RestoreUserFromSession = () => {
	const setUser = useAuthStore((state) => state.setUser);
	const setIsInitialized = useAuthStore((state) => state.setIsInitialized);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// sessionStorage からユーザー情報を復元
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

		// Supabase のトークン自動更新を監視し、Cookie・sessionStorage を更新する
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			if (session?.access_token) {
				// ミドルウェア用 Cookie を更新（有効期限はセッションの残り時間に合わせる）
				document.cookie = `access_token=${session.access_token}; path=/; max-age=3600`;
				// API 呼び出し用 sessionStorage を更新
				sessionStorage.setItem('access_token', session.access_token);
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [setUser, setIsInitialized]);

	return null;
};

export default RestoreUserFromSession;
