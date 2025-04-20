'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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

const FormSchema = z.object({
	username: z
		.string()
		.min(2, {
			message: 'ユーザー名は2文字以上で入力してください',
		})
		.max(15, { message: 'ユーザー名は15文字以内で入力してください' }),
	password: z.string().min(8, {
		message: 'パスワードは8文字以上で入力してください',
	}),
});

const SignIn = () => {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			username: '',
			password: '',
		},
	});

	const onSubmit = (data: z.infer<typeof FormSchema>) => {
		if (!data.username) {
			toast.error('ユーザー名が入力されていません', {
				duration: 3000,
				position: 'top-right',
			});
			return;
		}
		if (!data.password) {
			toast.error('パスワードが入力されていません', {
				duration: 3000,
				position: 'top-right',
			});
			return;
		}

		// toast.success('ログインに成功しました！', {
		// 	description: `ようこそ、${data.username}さん`,
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
						name="username"
						render={({ field }) => (
							<FormItem>
								<FormLabel>ユーザー名</FormLabel>
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
					<Button type="submit" variant="custom">
						サインイン
					</Button>
				</form>
				<Toaster position="top-right" />
			</Form>
		</>
	);
};

export default SignIn;
