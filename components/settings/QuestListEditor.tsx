'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { SquarePen, Trash2, Save } from 'lucide-react';

type Quest = {
	id: number;
	title: string;
	amount: number;
};

type QuestListEditorProps = {
	quest: Quest;
};

// お手伝いクエストのスキーマ
const questSchema = z.object({
	title: z.string().min(2, '2文字以上入力してください'),
	amount: z
		.number({ invalid_type_error: '数値で入力してください' })
		.min(1, '1以上の金額を入力してください'),
});

const QuestListEditor = ({ quest }: QuestListEditorProps) => {
	const [isEdting, setIsEditing] = useState(false);

	// フォーム初期化
	const form = useForm<z.infer<typeof questSchema>>({
		resolver: zodResolver(questSchema),
		defaultValues: {
			title: quest.title,
			amount: quest.amount,
		},
	});

	// フォーム送信処理
	const onSubmit = (data: z.infer<typeof questSchema>) => {
		console.log('登録されたお手伝い:', data);
		setIsEditing(false);
		// 後でAPI連携
	};

	return (
		<>
			<ul>
				<li>
					{isEdting ? (
						<Form {...form}>
							<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
								<div className="grid gap-2 md:grid-cols-[1fr_230px_60px] items-center px-4 py-3 shadow-sm bg-white">
									{/* タイトル入力 */}
									<FormField
										control={form.control}
										name={`title`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>タイトル</FormLabel>
												<FormControl>
													<Input placeholder="例：かたづけをする" {...field} />
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
										name={`amount`}
										render={({ field }) => (
											<FormItem>
												<FormLabel>加算金額（円）</FormLabel>
												<FormControl>
													<Input
														type="number"
														value={field.value}
														onChange={(e) => field.onChange(Number(e.target.value))}
													/>
												</FormControl>
												<div className="min-h-[1.25rem]">
													<FormMessage className="text-sm text-red-500" />
												</div>
											</FormItem>
										)}
									/>

									{/* 保存と削除ボタン */}
									<div className="flex justify-end md:justify-center items-center gap-2">
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<button type="submit" className="cursor-pointer" aria-label="保存">
														<Save size={23} />
													</button>
												</TooltipTrigger>
												<TooltipContent side="top">
													<p>保存する</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>

										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<button
														type="button"
														className="cursor-pointer"
														onClick={() => console.log(true)}
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
							</form>
						</Form>
					) : (
						<>
							<div className="grid gap-2 md:grid-cols-[1fr_230px_60px] items-center px-4 py-3 shadow-sm bg-white">
								<p className="font-medium text-base">{quest.title}</p>
								<p className="text-sm text-center px-3 py-1 bg-[var(--color-secondary)] rounded-lg w-fit quicksand">
									{quest.amount} 円
								</p>
								<div className="flex justify-end md:justify-center items-center">
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="cursor-pointer"
													onClick={() => setIsEditing(true)}
													aria-label="編集"
												>
													<SquarePen size={23} />
												</button>
											</TooltipTrigger>
											<TooltipContent side="top">
												<p>編集する</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
							</div>
						</>
					)}
				</li>
			</ul>
		</>
	);
};

export default QuestListEditor;
