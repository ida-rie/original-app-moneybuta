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
import { useState } from 'react';
import { BookOpenText, MailCheck } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';

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
	const [sentEmail, setSentEmail] = useState<string | null>(null);

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
			// supabase認証でサインアップ（メール確認あり）
			const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (signUpError) {
				console.error(signUpError);
				toast.error(`登録に失敗しました: ${signUpError.message}`);
				setIsLoading(false);
				return;
			}

			const user = signUpData.user;

			if (!user) {
				toast.error('ユーザー情報が取得できませんでした');
				setIsLoading(false);
				return;
			}

			// userテーブルにuser情報を登録（メール確認前でも先に作成しておく）
			const res = await fetch('/api/users/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: user.id,
					email,
					name,
					role: 'parent',
					iconUrl: null,
				}),
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('APIエラー:', errorText);
				toast.error('ユーザー情報の登録に失敗しました');
				setIsLoading(false);
				return;
			}

			// セッションが null = メール確認が必要（Supabase の Email Confirmation が ON）
			if (!signUpData.session) {
				setSentEmail(email);
				setIsLoading(false);
				return;
			}

			// セッションがある場合（Email Confirmation が OFF の開発環境など）はそのままログイン
			const accessToken = signUpData.session.access_token;
			document.cookie = `access_token=${accessToken}; path=/; max-age=86400`;
			sessionStorage.setItem('access_token', accessToken);

			// Zustand にユーザー情報を保存（sessionStorage への書き込みも内部で行われる）
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

	// メール確認待ち画面
	if (sentEmail) {
		return (
			<div className="flex flex-col items-center gap-6 py-8 text-center">
				<MailCheck size={64} className="text-[var(--color-primary)]" />
				<h2 className="text-xl font-bold">確認メールを送信しました</h2>
				<p className="text-muted-foreground text-sm max-w-sm">
					<span className="font-semibold">{sentEmail}</span> に確認メールを送りました。
					<br />
					メール内のリンクをクリックして登録を完了してください。
				</p>
				<p className="text-muted-foreground text-xs">
					メールが届かない場合は、迷惑メールフォルダをご確認ください。
				</p>
				<Link
					href="/signin"
					className="text-[var(--color-primary)] hover:underline text-sm mt-2"
				>
					サインインページへ
				</Link>
			</div>
		);
	}

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
								<FormLabel>メールアドレス</FormLabel>
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
