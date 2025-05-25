'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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

const FormSchema = z.object({
	userId: z
		.string()
		.min(1, { message: 'メールアドレスは必須です' })
		.email({ message: 'メールアドレスの形式が正しくありません' }),
	password: z.string().min(8, { message: 'パスワードは8文字以上で入力してください' }),
	username: z
		.string()
		.min(1, { message: 'ユーザー名は必須です' })
		.max(15, { message: 'ユーザー名は15文字以内で入力してください' }),
	userIconUrl: z.string(),
});

type FormData = z.infer<typeof FormSchema>;

type Mode = 'create' | 'edit' | 'childEdit';

type Props = {
	open: boolean;
	onClose: () => void;
	mode: Mode;
	defaultValues?: FormData;
	isParentAccount?: boolean; // 親アカウントかどうか
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
const ProfileEditDialog = ({
	open,
	onClose,
	mode,
	defaultValues,
	isParentAccount = true,
}: Props) => {
	const form = useForm<FormData>({
		resolver: zodResolver(FormSchema),
		defaultValues:
			mode === 'create'
				? { userId: '', password: '', username: '', userIconUrl: DEFAULT_ICON }
				: defaultValues || { userId: '', password: '', username: '', userIconUrl: DEFAULT_ICON },
	});

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [selectedIcon, setSelectedIcon] = useState<string>(
		mode === 'create' ? DEFAULT_ICON : defaultValues?.userIconUrl || DEFAULT_ICON
	);

	useEffect(() => {
		if (open) {
			form.reset(
				mode === 'create'
					? { userId: '', password: '', username: '', userIconUrl: DEFAULT_ICON }
					: defaultValues || { userId: '', password: '', username: '', userIconUrl: DEFAULT_ICON }
			);
			setSelectedIcon(
				mode === 'create' ? DEFAULT_ICON : defaultValues?.userIconUrl || DEFAULT_ICON
			);
		}
	}, [open, defaultValues, mode, form]);

	/** アイコン選択ハンドラー */
	const handleIconClick = (iconUrl: string) => {
		setSelectedIcon(iconUrl);
		form.setValue('userIconUrl', iconUrl, { shouldValidate: true });
	};

	/** フォーム送信ハンドラー */
	const onSubmit = (data: FormData) => {
		if (mode === 'create') {
			// 新規登録処理（例: API呼び出しなど）
			console.log('新規登録', data);
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
	const showDeleteButton = (mode === 'edit' || mode === 'childEdit') && isParentAccount;

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
							name="username"
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
							name="userId"
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
									<FormLabel>パスワード</FormLabel>
									<FormControl>
										<Input placeholder="パスワードを入力してください" {...field} type="password" />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" variant="primary">
							{submitButtonText}
						</Button>
						{showDeleteButton && (
							<Button
								type="button"
								variant="delete"
								onClick={() => setConfirmOpen(true)}
								className="mt-4"
							>
								削除
							</Button>
						)}
						<DeleteConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} />
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default ProfileEditDialog;
