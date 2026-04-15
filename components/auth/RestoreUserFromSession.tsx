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
	const setUserAndInitialize = useAuthStore((state) => state.setUserAndInitialize);
	const setIsInitialized = useAuthStore((state) => state.setIsInitialized);

	useEffect(() => {
		if (typeof window === 'undefined') return;

		// sessionStorage からユーザー情報を復元
		// user と isInitialized を1回の set() で同時更新することで、
		// re-render を2回→1回に抑制し SWR の重複リクエストを防ぐ
		const stored = sessionStorage.getItem('user');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				setUserAndInitialize(parsed); // user + isInitialized を同時更新（1 re-render）
			} catch (error) {
				console.error('ユーザー情報の復元に失敗しました:', error);
				setIsInitialized(true); // パース失敗時はフラグだけ立てる
			}
		} else {
			setIsInitialized(true); // ユーザーなし（未ログイン）の場合もフラグを立てる
		}

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
	}, [setUserAndInitialize, setIsInitialized]);

	return null;
};

export default RestoreUserFromSession;
