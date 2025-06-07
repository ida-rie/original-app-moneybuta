'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { useAuthStore } from '@/lib/zustand/authStore';

const FormSchema = z.object({
	emailOrId: z.string().min(1, { message: 'ユーザーIDは必須です' }),
	password: z.string().min(8, { message: 'パスワードは8文字以上で入力してください' }),
	name: z
		.string()
		.min(1, { message: 'ユーザー名は必須です' })
		.max(15, { message: 'ユーザー名は15文字以内で入力してください' }),
	iconUrl: z.string(),
});

type FormData = z.infer<typeof FormSchema>;

type Mode = 'create' | 'edit' | 'childEdit';

type Props = {
	open: boolean;
	onClose: () => void;
	mode: Mode;
	defaultValues?: FormData;
};

const iconList = [
	'/icon/ic_hero.png',
	'/icon/ic_idol.png',
	'/icon/ic_blue_ninja.png',
	'/icon/ic_pink_ninja.png',
	'/icon/ic_purple_alien.png',
	'/icon/ic_green_alien.png',
	'/icon/ic_pink_alien.png',
	'/icon/ic_ghost.png',
	'/icon/ic_pig.png',
];

const DEFAULT_ICON = '/icon/ic_pig.png';

/** ProfileEditDialogコンポーネント
 *  1つのダイアログで新規登録・編集（自分/子供）を処理
 */
const ProfileEditDialog = ({ open, onClose, mode, defaultValues }: Props) => {
	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		defaultValues:
			mode === 'create'
				? { emailOrId: '', password: '', name: '', iconUrl: DEFAULT_ICON }
				: defaultValues || { emailOrId: '', password: '', name: '', iconUrl: DEFAULT_ICON },
	});

	const user = useAuthStore((state) => state.user);

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [selectedIcon, setSelectedIcon] = useState<string>(
		mode === 'create' ? DEFAULT_ICON : defaultValues?.iconUrl || DEFAULT_ICON
	);

	useEffect(() => {
		if (open) {
			form.reset(
				mode === 'create'
					? { emailOrId: '', password: '', name: '', iconUrl: DEFAULT_ICON }
					: defaultValues || { emailOrId: '', password: '', name: '', iconUrl: DEFAULT_ICON }
			);
			setSelectedIcon(mode === 'create' ? DEFAULT_ICON : defaultValues?.iconUrl || DEFAULT_ICON);
		}
	}, [open, defaultValues, mode, form]);

	// アイコン選択
	const handleIconClick = (iconUrl: string) => {
		setSelectedIcon(iconUrl);
		form.setValue('iconUrl', iconUrl, { shouldValidate: true });
	};

	const onSubmit = async (data: z.infer<typeof FormSchema>) => {
		const { emailOrId, password, name } = data;
		// 子アカウントの場合、ユーザーIDを擬似的にメールアドレス形式にする
		const email = emailOrId.includes('@') ? emailOrId : `${emailOrId}@moneybuta.local`;

		if (mode === 'create') {
			// supabase認証でサインアップ
			const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
				email,
				password,
			});

			if (signUpError) {
				console.error(signUpError);
				toast.error(`登録に失敗しました: ${signUpError.message}`);
				return;
			}

			// userテーブルに登録するためにidを取得
			const childUser = signUpData.user;

			if (!childUser) {
				toast.error('ユーザー情報が取得できませんでした');
				return;
			}

			// userテーブルにuser情報を登録
			const res = await fetch('/api/users/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					id: childUser.id, // Supabaseのauth.user.idをUserテーブルのidに利用
					email,
					name,
					role: 'child',
					parentId: user!.id,
					iconUrl: selectedIcon ?? null,
				}),
			});

			if (!res.ok) {
				const errorText = await res.text(); // エラーメッセージを取得
				console.error('APIエラー:', errorText);
				toast.error('ユーザー情報の登録に失敗しました');
				return;
			}

			// 作成した子ユーザーの情報を親ユーザーに追加
			const addChild = useAuthStore.getState().addChild;
			addChild({
				id: childUser.id,
				email,
				name,
				role: 'child',
				iconUrl: null,
			});
		} else if (mode === 'edit') {
			// 自分の編集処理
			console.log('自分の編集', data);
		} else if (mode === 'childEdit') {
			// 子供アカウントの編集処理
			console.log('子供の編集', data);
		}
		onClose();
	};

	// モードによってタイトルとボタン文言を変更
	const dialogTitle =
		mode === 'create'
			? '子どもアカウント追加'
			: mode === 'childEdit'
			? '子どもアカウント変更'
			: 'ユーザープロフィールへんこう';

	const submitButtonText = mode === 'create' ? '登録' : '保存';

	// 削除ボタンは編集モードかつ親アカウントの場合のみ表示
	const showDeleteButton = (mode === 'edit' || mode === 'childEdit') && user?.role === 'parent';

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="bg-white w-full max-w-lg sm:max-w-xl max-h-screen overflow-auto">
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
				</DialogHeader>

				<div>
					{/* 選択中のアイコン表示 */}
					<div className="mx-auto w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]">
						<Image
							src={selectedIcon}
							alt="ユーザーアイコン"
							width={150}
							height={150}
							style={{ objectFit: 'contain' }}
						/>
					</div>

					{/* アイコン一覧 */}
					<div className="flex flex-wrap md:flex-nowrap justify-center gap-2 mt-4 px-2">
						{iconList.map((icon) => (
							<button
								key={icon}
								type="button"
								className={`flex items-center justify-center rounded cursor-pointer focus:outline-none ${
									selectedIcon === icon
										? 'ring-2 ring-blue-500 focus:ring-2 focus:ring-blue-500'
										: 'focus:ring-0'
								}`}
								onClick={() => handleIconClick(icon)}
								style={{ width: 50, height: 50 }}
							>
								<Image
									src={icon}
									alt="選択アイコン"
									width={40}
									height={40}
									style={{ objectFit: 'contain' }}
								/>
							</button>
						))}
					</div>
				</div>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="space-y-6 text-center px-4 sm:px-8"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>名まえ</FormLabel>
									<FormControl>
										<Input placeholder="名まえを入力してください" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="emailOrId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>ユーザーID</FormLabel>
									<FormControl>
										<Input placeholder="ユーザーIDを入力してください" {...field} />
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
									<FormLabel>新しいパスワード</FormLabel>
									<FormControl>
										<Input
											placeholder="新しいパスワードを入力してください"
											{...field}
											type="password"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex items-center justify-center gap-4">
							<Button type="submit" variant="primary">
								{submitButtonText}
							</Button>
							{showDeleteButton && (
								<Button type="button" variant="delete" onClick={() => setConfirmOpen(true)}>
									削除
								</Button>
							)}
						</div>
						<DeleteConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} />
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default ProfileEditDialog;
