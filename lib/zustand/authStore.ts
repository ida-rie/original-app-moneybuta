'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ユーザー情報の型
type UserSessionType = {
	id: string;
	email: string;
	name: string;
	role: string;
	iconUrl?: string | null;
};

// Zustandストアの状態の型
type AuthState = {
	user: UserSessionType | null;
	setUser: (user: UserSessionType) => void;
	clearUser: () => void;
};

// ZustandのsessionStorageラッパー
const sessionStorageProvider = createJSONStorage(() => sessionStorage);

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (user) => set({ user }),
			clearUser: () => set({ user: null }),
		}),
		{
			name: 'auth-storage',
			storage: sessionStorageProvider,
		}
	)
);
