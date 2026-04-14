'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/lib/zustand/authStore';
import { useState } from 'react';
import { BookOpenText } from 'lucide-react';

const FormSchema = z.object({
	email: z
		.string()
		.min(1, {
			message: 'メールアドレスは必須です',
		})
		.email({ message: 'メールアドレスの形式が正しくありません' }),
	password: z.string().min(8, {
		message: 'パスワードは8文字以上で入力してください',
	}),
	name: z
		.string()
		.min(1, {
			message: 'ユーザー名は必須です',
		})
		.max(15, { message: 'ユーザー名は15文字以内で入力してください' }),
});

const SignUp = () => {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			email: '',
			password: '',
			name: '',
		},
	});

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		setIsLoading(true);
		const { email, password, name } = data;

		try {
			// supabase認証でサインアップ
			const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
			});

			if (signUpError) {
				console.error(signUpError);
				toast.error(`登録に失敗しました: ${signUpError.message}`);
				setIsLoading(false);
				return;
			}

			// トークンをセッションストレージに保存
			const accessToken = signUpData.session!.access_token;

			// cookie に保存（middleware 用）
			document.cookie = `access_token=${accessToken}; path=/; max-age=86400`; // 有効期限1日

			// sessionStorage に保存（画面用：Zustandと連携）
			sessionStorage.setItem('access_token', accessToken);

			// userテーブルに登録するためにidを取得
			const user = signUpData.user;

			if (!user) {
				toast.error('ユーザー情報が取得できませんでした');
				setIsLoading(false);
				return;
			}

			// userテーブルにuser情報を登録
			const res = await fetch('/api/users/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: user.id, // Supabaseのauth.user.idをUserテーブルのidに利用
					email,
					name,
					role: 'parent',
					iconUrl: null,
				}),
			});

			if (!res.ok) {
				const errorText = await res.text(); // エラーメッセージを取得
				console.error('APIエラー:', errorText);
				toast.error('ユーザー情報の登録に失敗しました');
				setIsLoading(false);
				return;
			}

			// Zustandに保存
			const setUser = useAuthStore.getState().setUser;
			setUser({
				id: user.id,
				email,
				name,
				role: 'parent',
				iconUrl: null,
				children: [],
			});

			toast.success('サインアップに成功しました🐷');

			setIsLoading(false);

			router.push('/');
		} catch (error) {
			console.error('サインアップ処理中のエラー:', error);
			toast.error('予期しないエラーが発生しました');
			setIsLoading(false);
		}
	};

	return (
		<>
			<Image
				src="/logo.png"
				alt="マネぶた おこづかいクエスト"
				width={350}
				height={350}
				className="m-auto"
			/>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-center">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ユーザーID</FormLabel>
								<FormControl>
									<Input placeholder="メールアドレスを入力してください" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>パスワード</FormLabel>
								<FormControl>
									<Input type="password" placeholder="パスワードを入力してください" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ユーザー名(表示名)</FormLabel>
								<FormControl>
									<Input placeholder="ユーザー名を入力してください" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" variant="primary" disabled={isLoading}>
						{isLoading ? '登録中…' : '新規登録'}
					</Button>
				</form>
			</Form>
			<div className="mt-6 flex items-center justify-center text-[var(--color-primary)] hover:underline">
				<Link href="/signin">サインインはこちら</Link>
			</div>

			<div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
				<Link href="/guide?from=signup" className="flex items-center gap-1 hover:underline">
					<BookOpenText size={20} />
					アプリのつかいかたを見る
				</Link>
			</div>
		</>
	);
};

export default SignUp;
