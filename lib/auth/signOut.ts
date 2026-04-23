'use client';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/zustand/authStore';
import { mutate } from 'swr';
import { clearSessionCookie } from '@/lib/client/authSession';

export const signOut = async (): Promise<boolean> => {
	const { error } = await supabase.auth.signOut();
	if (error) console.warn('Supabaseセッションの破棄で警告:', error.message);

	await clearSessionCookie();

	// Zustand のストアをリセット
	const { clearUser, setSelectedChild } = useAuthStore.getState();
	clearUser();
	setSelectedChild(null);

	// SWR 全キャッシュをクリア（再フェッチなし）
	await mutate(() => true, undefined, { revalidate: false });

	return true;
};

export default signOut;
