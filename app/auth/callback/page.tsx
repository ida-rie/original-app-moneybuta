'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/zustand/authStore';
import { toast } from 'sonner';
import { syncSessionCookie } from '@/lib/client/authSession';

const AuthCallbackPage = () => {
	const router = useRouter();
	const [message, setMessage] = useState('メールアドレスを確認中...');

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Supabase JS SDK がURLハッシュ（#access_token=...）を自動処理してセッションを返す
				const {
					data: { session },
					error,
				} = await supabase.auth.getSession();

				if (error || !session) {
					setMessage('確認に失敗しました。もう一度お試しください。');
					toast.error('メールアドレスの確認に失敗しました');
					setTimeout(() => router.push('/signin'), 2000);
					return;
				}

				await syncSessionCookie(session);

				// DBからユーザー情報を取得
				const res = await fetch('/api/auth/me', { credentials: 'include' });
				if (!res.ok) {
					toast.error('ユーザー情報の取得に失敗しました');
					setTimeout(() => router.push('/signin'), 2000);
					return;
				}

				const userInfo = await res.json();

				// Zustand にユーザー情報を保存
				const setUser = useAuthStore.getState().setUser;
				setUser({
					id: userInfo.id,
					email: userInfo.email,
					loginId: userInfo.loginId,
					name: userInfo.name,
					role: userInfo.role,
					iconUrl: userInfo.iconUrl,
					children: userInfo.role === 'parent' ? userInfo.children ?? [] : undefined,
				});

				toast.success('メールアドレスの確認が完了しました🐷');
				router.push('/');
			} catch (err) {
				console.error('コールバック処理エラー:', err);
				setMessage('エラーが発生しました。');
				setTimeout(() => router.push('/signin'), 2000);
			}
		};

		handleCallback();
	}, [router]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen gap-4">
			<div className="animate-spin rounded-full h-10 w-10 border-4 border-[var(--color-primary)] border-t-transparent" />
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	);
};

export default AuthCallbackPage;
