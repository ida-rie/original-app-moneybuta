'use client';

import { create } from 'zustand';

// ユーザーの型定義
export type ChildUser = {
	id: string;
	email: string;
	name: string;
	role: 'child';
	iconUrl: string | null;
};

export type ParentUser = {
	id: string;
	email: string;
	name: string;
	role: 'parent';
	iconUrl: string | null;
	children: ChildUser[];
};

type User = ParentUser | ChildUser;

type AuthState = {
	// === 追加したフラグ ===
	isInitialized: boolean;
	setIsInitialized: (v: boolean) => void;

	user: User | null;
	setUser: (user: User | null) => void;
	clearUser: () => void;

	addChild: (child: ChildUser) => void;
	removeChild: (childId: string) => void;

	selectedChild: ChildUser | null;
	setSelectedChild: (child: ChildUser | null) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
	// —— 初期状態 ——
	isInitialized: false,
	user: null,
	selectedChild: null,

	// —— セッションからの復元完了フラグ ——
	setIsInitialized: (v) => set({ isInitialized: v }),

	// —— ユーザー設定 ——
	setUser: (user) => {
		set({ user });
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('user', JSON.stringify(user));
		}
	},

	// —— ユーザークリア ——
	clearUser: () => {
		set({ user: null });
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('user');
		}
	},

	// —— 子アカウント操作 ——
	addChild: (child) => {
		const cu = get().user;
		if (cu && cu.role === 'parent') {
			const updated = { ...cu, children: [...cu.children, child] };
			set({ user: updated });
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('user', JSON.stringify(updated));
			}
		}
	},
	removeChild: (childId) => {
		const cu = get().user;
		if (cu && cu.role === 'parent') {
			const updated = {
				...cu,
				children: cu.children.filter((c) => c.id !== childId),
			};
			set({ user: updated });
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('user', JSON.stringify(updated));
			}
		}
	},

	// —— 選択中の子アカウント ——
	setSelectedChild: (child) => set({ selectedChild: child }),
}));
