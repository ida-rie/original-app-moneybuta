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

type BasicAmount = {
	amount: number;
};

type BasicAmountProps = {
	basicAmount: BasicAmount;
};

// 基本金額のスキーマ
const basinAmontSchema = z.object({
	amount: z
		.number({ invalid_type_error: '数値で入力してください' })
		.min(1, '1以上の金額を入力してください'),
});

const BasicAmountEditor = ({ basicAmount }: BasicAmountProps) => {
	const [isEdting, setIsEditing] = useState(false);

	// フォーム初期化
	const form = useForm<z.infer<typeof basinAmontSchema>>({
		resolver: zodResolver(basinAmontSchema),
		defaultValues: {
			amount: basicAmount.amount,
		},
	});

	// フォーム送信処理
	const onSubmit = (data: z.infer<typeof basinAmontSchema>) => {
		console.log('登録されたお手伝い:', data);
		setIsEditing(false);
		// 後でAPI連携
	};
	return (
		<>
			{isEdting ? (
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="w-full md:w-1/2 grid gap-2 md:grid-cols-[1fr_60px] items-center px-4 py-3 shadow-sm bg-white">
							{/* 金額入力 */}
							<FormField
								control={form.control}
								name={`amount`}
								render={({ field }) => (
									<FormItem>
										<FormLabel>基本金額（円）</FormLabel>
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
					<div className="w-full md:w-1/2  grid gap-2 md:grid-cols-[1fr_60px] items-center px-4 py-3 shadow-sm bg-white">
						<p className="font-medium text-lg quicksand">{basicAmount.amount} 円</p>
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
		</>
	);
};

export default BasicAmountEditor;
