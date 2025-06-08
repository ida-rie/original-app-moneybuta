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

const FormSchema = z.object({
	emailOrId: z.string().min(1, {
		message: 'ユーザーIDは必須です',
	}),
	password: z.string().min(8, {
		message: 'パスワードは8文字以上で入力してください',
	}),
});

const SignIn = () => {
	const router = useRouter();

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			emailOrId: '',
			password: '',
		},
	});

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		const { emailOrId, password } = data;

		// 子アカウントの場合、ユーザーIDを擬似的にメールアドレス形式にする
		const email = emailOrId.includes('@') ? emailOrId : `${emailOrId}@moneybuta.local`;

		// supabase認証でサインイン
		const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (signInError || !signInData.user) {
			toast.error('メールアドレスまたはパスワードが間違っています');
			return;
		}

		// トークンをセッションストレージに保存
		if (signInData.session?.access_token) {
			sessionStorage.setItem('access_token', signInData.session.access_token);
			console.log(signInData.session.access_token);
		}

		// idに紐づくuserの情報を取得
		const user = signInData.user;

		const res = await fetch(`/api/users/${user.id}`);
		if (!res.ok) {
			const errorText = await res.text(); // エラーメッセージを取得
			console.error('APIエラー:', errorText);
			toast.error('ユーザー情報の取得に失敗しました');
			return;
		}

		const userInfo = await res.json();

		// Zustandに保存
		const setUser = useAuthStore.getState().setUser;
		setUser({
			id: userInfo.id,
			email: userInfo.email,
			name: userInfo.name,
			role: userInfo.role,
			iconUrl: userInfo.iconUrl,
			children: userInfo.role === 'parent' ? userInfo.children ?? [] : undefined,
		});

		toast.success('サインインに成功しました🐷');

		// 少し待ってからホーム画面に遷移
		setTimeout(() => {
			router.push('/');
		}, 800);
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
						name="emailOrId"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ユーザーID</FormLabel>
								<FormControl>
									<Input
										placeholder="ユーザー名またはメールアドレスを入力してください"
										{...field}
									/>
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
									<Input placeholder="パスワードを入力してください" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit" variant="primary">
						サインイン
					</Button>
				</form>
			</Form>
			<div className="mt-6 flex items-center justify-center text-[var(--color-primary)] hover:underline">
				<Link href="/signup">親アカウントの新規登録はこちら</Link>
			</div>
		</>
	);
};

export default SignIn;
