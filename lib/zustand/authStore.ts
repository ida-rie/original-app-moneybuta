'use client';

import { create } from 'zustand';

// ユーザーの型定義
export type ChildUser = {
	id: string;
	email: string;
	loginId?: string | null;
	name: string;
	role: 'child';
	iconUrl: string | null;
};

export type ParentUser = {
	id: string;
	email: string;
	loginId?: string | null;
	name: string;
	role: 'parent';
	iconUrl: string | null;
	children: ChildUser[];
};

type User = ParentUser | ChildUser;

const SELECTED_CHILD_STORAGE_KEY = 'selected_child_id';

const persistSelectedChildId = (child: ChildUser | null) => {
	if (typeof window === 'undefined') return;
	if (child?.id) {
		sessionStorage.setItem(SELECTED_CHILD_STORAGE_KEY, child.id);
		return;
	}
	sessionStorage.removeItem(SELECTED_CHILD_STORAGE_KEY);
};

const resolveSelectedChild = (
	user: User | null,
	current: ChildUser | null
): ChildUser | null => {
	if (!user || user.role !== 'parent' || user.children.length === 0) return null;

	// 現在の選択が有効なら維持
	if (current) {
		const stillExists = user.children.find((child) => child.id === current.id);
		if (stillExists) return stillExists;
	}

	// sessionStorage の選択値を復元
	if (typeof window !== 'undefined') {
		const storedId = sessionStorage.getItem(SELECTED_CHILD_STORAGE_KEY);
		if (storedId) {
			const restored = user.children.find((child) => child.id === storedId);
			if (restored) return restored;
		}
	}

	// 復元不可なら先頭を選択
	return user.children[0] ?? null;
};

type AuthState = {
	// === 追加したフラグ ===
	isInitialized: boolean;
	setIsInitialized: (v: boolean) => void;

	user: User | null;
	setUser: (user: User | null) => void;
	/** user と isInitialized を1回の set() で同時更新し、re-render を1回に抑制する */
	setUserAndInitialize: (user: User | null) => void;
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
		const nextSelected = resolveSelectedChild(user, get().selectedChild);
		set({ user, selectedChild: nextSelected });
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('user', JSON.stringify(user));
		}
		persistSelectedChildId(nextSelected);
	},

	// —— user + isInitialized を1回の set() で同時更新（re-render を1回に抑制）——
	setUserAndInitialize: (user) => {
		const nextSelected = resolveSelectedChild(user, get().selectedChild);
		set({ user, selectedChild: nextSelected, isInitialized: true });
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('user', JSON.stringify(user));
		}
		persistSelectedChildId(nextSelected);
	},

	// —— ユーザークリア ——
	clearUser: () => {
		set({ user: null, selectedChild: null });
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('user');
		}
		persistSelectedChildId(null);
	},

	// —— 子アカウント操作 ——
	addChild: (child) => {
		const cu = get().user;
		if (cu && cu.role === 'parent') {
			const updated = { ...cu, children: [...cu.children, child] };
			const nextSelected = resolveSelectedChild(updated, get().selectedChild);
			set({ user: updated, selectedChild: nextSelected });
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('user', JSON.stringify(updated));
			}
			persistSelectedChildId(nextSelected);
		}
	},
	removeChild: (childId) => {
		const cu = get().user;
		if (cu && cu.role === 'parent') {
			const updated = {
				...cu,
					children: cu.children.filter((c) => c.id !== childId),
			};
			const nextSelected = resolveSelectedChild(updated, get().selectedChild);
			set({ user: updated, selectedChild: nextSelected });
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('user', JSON.stringify(updated));
			}
			persistSelectedChildId(nextSelected);
		}
	},

	// —— 選択中の子アカウント ——
	setSelectedChild: (child) => {
		set({ selectedChild: child });
		persistSelectedChildId(child);
	},
}));
