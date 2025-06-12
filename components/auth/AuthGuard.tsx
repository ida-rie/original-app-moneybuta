'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/authStore';

type Props = { children: ReactNode };

const AuthGuard = ({ children }: Props) => {
	const { user, isInitialized } = useAuthStore();
	const router = useRouter();

	// セッション復元後、未ログインならサインインへ飛ばす
	useEffect(() => {
		if (isInitialized && !user) {
			router.push('/signin');
		}
	}, [isInitialized, user, router]);

	// 復元中 or 未ログインなら何も描かない
	if (!isInitialized || !user) return null;

	// 認証＆初期化OKなら子要素を描画
	return <>{children}</>;
};

export default AuthGuard;
