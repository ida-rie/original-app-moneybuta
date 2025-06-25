'use client';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/zustand/authStore';

export const signOut = async (): Promise<boolean> => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('サインアウト失敗:', error.message);
		return false;
	}

	document.cookie = 'access_token=; path=/; max-age=0';
	sessionStorage.removeItem('access_token');

	// Zustand のストアをリセット
	const { clearUser, setSelectedChild } = useAuthStore.getState();
	clearUser();
	setSelectedChild(null);

	return true;
};

export default signOut;
