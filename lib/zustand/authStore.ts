'use client';

import { create } from 'zustand';
// import { persist, createJSONStorage } from 'zustand/middleware';
import { persist } from 'zustand/middleware';

// ユーザーの型
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
	children: ChildUser[]; // 親ユーザーが持つ子リスト
};

// Zustandのステート定義
type AuthState = {
	user: ParentUser | ChildUser | null;
	setUser: (user: ParentUser | ChildUser) => void;
	addChild: (child: ChildUser) => void;
	clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			user: null,
			setUser: (user) => set({ user }),
			addChild: (child) => {
				const currentUser = get().user;
				// 親ユーザーであれば children を追加
				if (currentUser && currentUser.role === 'parent') {
					const updatedParent: ParentUser = {
						...currentUser,
						children: currentUser.children ? [...currentUser.children, child] : [child],
					};
					set({ user: updatedParent });
				}
			},
			clearUser: () => set({ user: null }),
		}),
		{
			name: 'auth', // 保存名
			storage:
				typeof window !== 'undefined'
					? {
							getItem: (name) => {
								const value = window.sessionStorage.getItem(name);
								return value ? JSON.parse(value) : null;
							},
							setItem: (name, value) => {
								window.sessionStorage.setItem(name, JSON.stringify(value));
							},
							removeItem: (name) => {
								window.sessionStorage.removeItem(name);
							},
					  }
					: undefined,
		}
	)
);
