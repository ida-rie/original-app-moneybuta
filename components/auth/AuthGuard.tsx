'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/authStore';
import AuthRestoreLoading from '@/components/auth/AuthRestoreLoading';

type Props = { children: ReactNode };

const AuthGuard = ({ children }: Props) => {
	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const isInitialized = useAuthStore((state) => state.isInitialized);
	const router = useRouter();

	// セッション復元後、未ログインならサインインへ飛ばす
	useEffect(() => {
		if (isInitialized && !user) {
			router.push('/signin');
		}
	}, [isInitialized, user, router]);

	// 復元中はローディング表示
	if (!isInitialized) return <AuthRestoreLoading />;

	// 未ログインはリダイレクト（描画はしない）
	if (!user) return null;

	// 認証＆初期化OKなら子要素を描画
	return <>{children}</>;
};

export default AuthGuard;
