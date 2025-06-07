'use client';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/zustand/authStore';

export const signOut = async (): Promise<boolean> => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		console.error('サインアウト失敗:', error.message);
		return false;
	}

	useAuthStore.getState().clearUser();
	return true;
};

export default signOut;
