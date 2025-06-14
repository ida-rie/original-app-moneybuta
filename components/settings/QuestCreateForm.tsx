'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import { useAuthStore } from '@/lib/zustand/authStore';
import { toast } from 'sonner';
import { BaseQuestType } from '@/types/baseQuestType';
import { KeyedMutator } from 'swr';

// お手伝いクエストのスキーマ
const questSchema = z.object({
	title: z.string().min(2, '2文字以上入力してください'),
	reward: z
		.number({ invalid_type_error: '数値で入力してください' })
		.min(1, '1以上の金額を入力してください'),
});

// フォーム全体のスキーマ
const formSchema = z.object({
	quests: z.array(questSchema).min(1, '最低1つは必要です'),
});

type FormValues = z.infer<typeof formSchema>;

type QuestCreateFormProps = {
	mutate: KeyedMutator<BaseQuestType[]>;
};

const QuestCreateForm = ({ mutate }: QuestCreateFormProps) => {
	// フォーム初期化
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			quests: [{ title: '', reward: 0 }],
		},
	});
	// 動的フィールド管理
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'quests',
	});

	// フォーム送信処理
	const onSubmit = async (data: FormValues) => {
		try {
			const accessToken = sessionStorage.getItem('access_token');
			if (!accessToken) {
				alert('アクセストークンが見つかりません');
				return;
			}

			// ユーザー情報の取得
			const user = useAuthStore.getState().user;
			const selectedChild = useAuthStore.getState().selectedChild;

			if (!user || !selectedChild) {
				alert('ユーザー情報が不正です');
				return;
			}

			const response = await fetch('/api/base-quests', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					quests: data.quests,
					childUserId: selectedChild.id,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('エラー内容:', errorData);
				alert('登録に失敗しました');
				return;
			}

			toast('クエストを登録しました');
			await mutate();
			form.reset(); // 初期化したい場合
		} catch (error) {
			console.error('送信エラー:', error);
			toast('予期せぬエラーが発生しました');
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{fields.map((field, index) => (
					<div
						key={field.id}
						className="grid gap-2 md:grid-cols-[1fr_230px_60px] items-center px-4 py-3 mb-0"
					>
						{/* タイトル入力 */}
						<FormField
							control={form.control}
							name={`quests.${index}.title`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>タイトル</FormLabel>
									<FormControl>
										<Input placeholder="例：かたづけをする" className="bg-white" {...field} />
									</FormControl>
									<div className="min-h-[1.25rem]">
										<FormMessage className="text-sm text-red-500" />
									</div>
								</FormItem>
							)}
						/>

						{/* 金額入力 */}
						<FormField
							control={form.control}
							name={`quests.${index}.reward`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>加算金額（円）</FormLabel>
									<FormControl>
										<Input
											type="number"
											value={field.value}
											onChange={(e) => field.onChange(Number(e.target.value))}
											className="bg-white"
										/>
									</FormControl>
									<div className="min-h-[1.25rem]">
										<FormMessage className="text-sm text-red-500" />
									</div>
								</FormItem>
							)}
						/>

						{/* 削除ボタン */}
						<div className="flex justify-end md:justify-center items-center">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											type="button"
											className="cursor-pointer"
											onClick={() => remove(index)}
											aria-label="削除"
										>
											<Trash2 size={23} />
										</button>
									</TooltipTrigger>
									<TooltipContent side="top">
										<p>削除する</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>
				))}

				{/* 追加ボタン */}
				<div className="px-4">
					<Button type="button" variant="add" onClick={() => append({ title: '', reward: 0 })}>
						＋追加する
					</Button>
				</div>

				{/* 登録ボタン */}
				<div className="text-right">
					<Button type="submit" variant="primary">
						クエスト設定
					</Button>
				</div>
			</form>
		</Form>
	);
};

export default QuestCreateForm;
