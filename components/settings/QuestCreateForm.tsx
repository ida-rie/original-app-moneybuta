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

// お手伝いクエストのスキーマ
const questSchema = z.object({
	title: z.string().min(2, '2文字以上入力してください'),
	amount: z
		.number({ invalid_type_error: '数値で入力してください' })
		.min(1, '1以上の金額を入力してください'),
});

// フォーム全体のスキーマ
const formSchema = z.object({
	quests: z.array(questSchema).min(1, '最低1つは必要です'),
});

type FormValues = z.infer<typeof formSchema>;

const QuestCreateForm = () => {
	// フォーム初期化
	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			quests: [{ title: '', amount: 0 }],
		},
	});
	// 動的フィールド管理
	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: 'quests',
	});

	// フォーム送信処理
	const onSubmit = (data: FormValues) => {
		console.log('登録されたお手伝い:', data);
		// 後でAPI連携
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
							name={`quests.${index}.amount`}
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
					<Button type="button" variant="add" onClick={() => append({ title: '', amount: 0 })}>
						+ 追加する
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
