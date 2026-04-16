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
import { BasicAmountType } from '@/types/basicAmountType';
import { useAuthStore } from '@/lib/zustand/authStore';
import { KeyedMutator } from 'swr';
import { toast } from 'sonner';
import { apiJson, apiRequest } from '@/lib/client/apiClient';

type BasicAmountProps = {
	basicAmount: BasicAmountType | null;
	mutate: KeyedMutator<BasicAmountType | null>;
};

// 基本金額のスキーマ
const basinAmontSchema = z.object({
	basicAmount: z
		.number({ invalid_type_error: '数値で入力してください' })
		.min(1, '1以上の金額を入力してください'),
});

const BasicAmountEditor = ({ basicAmount, mutate }: BasicAmountProps) => {
	const [isEdting, setIsEditing] = useState(!basicAmount);

	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);
	const selectedChild = useAuthStore((state) => state.selectedChild);

	// フォーム初期化
	const form = useForm<z.infer<typeof basinAmontSchema>>({
		resolver: zodResolver(basinAmontSchema),
		defaultValues: {
			basicAmount: basicAmount?.basicAmount ?? 0,
		},
	});

	// フォーム送信処理（更新）
	const onSubmit = async (data: z.infer<typeof basinAmontSchema>) => {
		try {
			const childUserId = useAuthStore.getState().selectedChild?.id;
			if (!childUserId) {
				toast.error('子アカウントが選択されていません');
				return;
			}

			const endpoint = basicAmount ? `/api/basic-amount/${basicAmount.id}` : '/api/basic-amount';

			const method = basicAmount ? 'PUT' : 'POST';

			await apiJson(endpoint, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					basicAmount: data.basicAmount,
					childUserId,
				}),
			});

			await mutate(); // 再取得
			setIsEditing(false);
			toast.success('基本金額を保存しました');
		} catch (err) {
			console.error('保存エラー:', err);
			toast.error('基本金額の保存に失敗しました');
		}
	};

	// 基本金額の削除
	const handleAmountDelete = async (id: string) => {
		try {
			if (!user || !selectedChild) {
				toast.error('ユーザー情報が不正です');
				return;
			}

			const res = await apiRequest(`/api/basic-amount/${id}`, {
				method: 'DELETE',
			});

			if (!res.ok) {
				const error = await res.json();
				toast.error(`基本金額の削除に失敗しました: ${error.error}`);
				return;
			}

			toast.success('基本金額を削除しました');
			await mutate(); // 基本金額を再取得
			form.reset();
		} catch (error) {
			console.error('削除エラー:', error);
			toast.error('予期せぬエラーが発生しました');
		}
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
								name="basicAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>基本金額（円）</FormLabel>
										<FormControl>
											<Input
												type="number"
												value={field.value === 0 ? '' : field.value}
												onChange={(e) => field.onChange(Number(e.target.value))}
											/>
										</FormControl>
										<div className="min-h-[1.25rem]">
											<FormMessage className="text-sm text-red-500" />
										</div>
									</FormItem>
								)}
							/>

							{/* 保存・削除 */}
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

								{/* 既存データがあるときのみ削除ボタン表示 */}
								{basicAmount && (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<button
													type="button"
													className="cursor-pointer"
													onClick={() => handleAmountDelete(basicAmount.id)}
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
								)}
							</div>
						</div>
					</form>
				</Form>
			) : (
				<>
					<div className="w-full md:w-1/2 grid gap-2 md:grid-cols-[1fr_60px] items-center px-4 py-3 shadow-sm bg-white">
						<p className="font-medium text-lg quicksand">{basicAmount?.basicAmount ?? 0} 円</p>
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
