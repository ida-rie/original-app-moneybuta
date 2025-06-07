'use client';

import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast, Toaster } from 'sonner';
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
		if (!emailOrId) {
			toast.error('ユーザーIDが入力されていません', {
				duration: 3000,
				position: 'top-right',
			});
			return;
		}
		if (!password) {
			toast.error('パスワードが入力されていません', {
				duration: 3000,
				position: 'top-right',
			});
			return;
		}

		const email = emailOrId.includes('@') ? emailOrId : `${emailOrId}@yourapp.com`; // ← 固定ドメインは環境変数などで管理してもOK

		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			console.log(error.message);
		} else {
			router.push('/');
		}

		// toast.success('ログインに成功しました！', {
		// 	description: `ようこそ、${data.userId}さん`,
		// 	duration: 3000,
		// 	position: 'top-right',
		// });

		// toast.custom(
		// 	(t) => (
		// 		<div className="flex items-center gap-3 bg-red-100 text-red-800 border border-red-300 px-4 py-3 rounded-md shadow">
		// 			<span className="text-xl">❌</span>
		// 			<span>サインインに失敗しました</span>
		// 			<button
		// 				onClick={() => toast.dismiss(t)}
		// 				className="ml-auto text-sm text-red-600 hover:underline"
		// 			>
		// 				閉じる
		// 			</button>
		// 		</div>
		// 	),
		// 	{
		// 		duration: 3000,
		// 	}
		// );
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
				<Toaster position="top-right" />
			</Form>
			<div className="mt-6 flex items-center justify-center text-[var(--color-primary)] hover:underline">
				<Link href="/signup">親アカウントの新規登録はこちら</Link>
			</div>
		</>
	);
};

export default SignIn;
