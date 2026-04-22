'use client';

import React, { useLayoutEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase'; // パスワード変更後の再ログインに使用
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
import { ChildUser, ParentUser, useAuthStore } from '@/lib/zustand/authStore';
import { apiJson } from '@/lib/client/apiClient';

type Mode = 'create' | 'edit' | 'childEdit';

type ProfileEditDialogProps = {
	open: boolean;
	onClose: () => void;
	mode: Mode;
	defaultValues?: {
		emailOrId?: string;
		name?: string;
		password?: string;
		iconUrl?: string;
	};
	targetUserId?: string; // 編集対象のユーザー（親自身または子）
};

// 作成バリデーションスキーマ（アイコン以外必須）
const createUserSchema = z.object({
	emailOrId: z.string().min(1, { message: 'ユーザーIDは必須です' }),
	password: z.string().min(8, { message: 'パスワードは8文字以上必要です' }),
	name: z
		.string()
		.min(1, { message: 'ユーザー名は必須です' })
		.max(15, { message: 'ユーザー名は15文字以内で入力してください' }),
	iconUrl: z.string().optional(),
});

// 編集バリデーションスキーマ（すべて任意）
const editUserSchema = z.object({
	emailOrId: z.string().optional(),
	password: z
		.string()
		.optional()
		.or(z.literal('')) // 空文字も許容
		.refine((val) => !val || val.length >= 8, {
			message: 'パスワードは8文字以上で入力してください',
		}),
	name: z.string().optional(),
	iconUrl: z.string().optional(),
});

const getSchemaByMode = (mode: Mode) => {
	return mode === 'create' ? createUserSchema : editUserSchema;
};

type CreateFormData = z.infer<typeof createUserSchema>;
type EditFormData = z.infer<typeof editUserSchema>;
type StoreUser = ParentUser | ChildUser;

const getInitialValues = (
	mode: Mode,
	defaultValues?: ProfileEditDialogProps['defaultValues']
): z.infer<ReturnType<typeof getSchemaByMode>> => {
	if (mode === 'create') {
		return {
			emailOrId: '',
			password: '',
			name: '',
			iconUrl: '',
			...defaultValues,
		};
	}
	return {
		emailOrId: defaultValues?.emailOrId ?? '',
		password: '',
		name: defaultValues?.name ?? '',
		iconUrl: defaultValues?.iconUrl ?? '',
	};
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

// 1つのダイアログで新規登録・編集（自分/子供）・削除を処理
const ProfileEditDialog = ({
	open,
	onClose,
	mode,
	defaultValues,
	targetUserId,
}: ProfileEditDialogProps) => {
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [selectedIcon, setSelectedIcon] = useState<string>(
		mode === 'create'
			? DEFAULT_ICON
			: defaultValues?.iconUrl && defaultValues.iconUrl.trim() !== ''
			? defaultValues.iconUrl
			: DEFAULT_ICON
	);
	const schema = useMemo(() => getSchemaByMode(mode), [mode]);

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			emailOrId: defaultValues?.emailOrId ?? '',
			password: '',
			name: defaultValues?.name ?? '',
			iconUrl: defaultValues?.iconUrl ?? '',
		},
	});

	// 必要な state のみを取得
	const user = useAuthStore((state) => state.user);

	// モードによってタイトルとボタン文言を変更
	const dialogTitleMap: Record<Mode, string> = {
		create: '子どもアカウント追加',
		edit: 'ユーザープロフィールへんこう',
		childEdit: '子どもアカウント変更',
	};

	const submitButtonTextMap: Record<Mode, string> = {
		create: '登録',
		edit: '保存',
		childEdit: '保存',
	};

	// 削除ボタンは編集モードかつ親アカウントの場合のみ表示
	const showDeleteButton = (mode === 'edit' || mode === 'childEdit') && user?.role === 'parent';

	// 子アカウント自身が編集する場合はID/PWフィールドを非表示
	const isChildSelfEdit = mode === 'edit' && user?.role === 'child';
	const isChildAccountMode = mode === 'create' || mode === 'childEdit' || isChildSelfEdit;

	useLayoutEffect(() => {
		if (open) {
			const values = getInitialValues(mode, defaultValues);
			form.reset(values);

			const initialIcon =
				values.iconUrl && values.iconUrl.trim() !== '' ? values.iconUrl : DEFAULT_ICON;
			setSelectedIcon(initialIcon);

			form.setValue('iconUrl', initialIcon);
		}
	}, [open, defaultValues, mode, form]);

	// アイコン選択
	const handleIconClick = (iconUrl: string) => {
		setSelectedIcon(iconUrl);
		form.setValue('iconUrl', iconUrl, { shouldValidate: true });
	};

	// 子アカウント作成（サーバーサイドで Auth ユーザーを作成してメール確認をスキップ）
	const handleCreate = async (data: CreateFormData) => {
		const { emailOrId, password, name, iconUrl } = data;
		const loginId = emailOrId.trim();

		// サーバーサイドで Auth 作成 + DB 登録を一括処理
		try {
			const createdChild = await apiJson<{
				id: string;
				email: string;
				loginId: string | null;
			}>('/api/users/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					loginId,
					password,
					name,
					role: 'child',
					parentId: user!.id,
					iconUrl: iconUrl ?? DEFAULT_ICON,
				}),
			});

			// 作成した子ユーザーの情報を親ユーザーに追加
			const { addChild } = useAuthStore.getState();
			addChild({
				id: createdChild.id,
				email: createdChild.email,
				loginId: createdChild.loginId ?? loginId,
				name,
				role: 'child',
				iconUrl: selectedIcon ?? null,
			});

			toast.success('子どもユーザーを追加しました🐷');

			return true;
		} catch (error) {
			console.error('APIエラー:', error);
			const message = error instanceof Error ? error.message : 'エラーが発生しました';
			toast.error(`登録に失敗しました: ${message}`);
			return false;
		}
	};

	// ユーザー情報を編集
	const handleEdit = async (data: EditFormData) => {
		const { emailOrId, password, name } = data;
		const defaultName = defaultValues?.name?.trim() ?? '';
		const defaultIcon =
			defaultValues?.iconUrl && defaultValues.iconUrl.trim() !== ''
				? defaultValues.iconUrl.trim()
				: DEFAULT_ICON;
		const defaultEmailOrId = defaultValues?.emailOrId?.trim() ?? '';

		const updateData: Record<string, string> = {};

		const trimmedName = name?.trim() ?? '';
		if (trimmedName && trimmedName !== defaultName) {
			updateData.name = trimmedName;
		}

		const normalizedIcon = selectedIcon?.trim() || DEFAULT_ICON;
		if (normalizedIcon !== defaultIcon) {
			updateData.iconUrl = normalizedIcon;
		}

		if (!isChildSelfEdit) {
			const trimmedEmailOrId = emailOrId?.trim() ?? '';
			if (trimmedEmailOrId) {
				if (mode === 'childEdit') {
					if (trimmedEmailOrId !== defaultEmailOrId) {
						updateData.loginId = trimmedEmailOrId;
					}
				} else if (trimmedEmailOrId !== defaultEmailOrId) {
					updateData.email = trimmedEmailOrId;
				}
			}

			const trimmedPassword = password?.trim() ?? '';
			if (trimmedPassword) {
				updateData.password = trimmedPassword;
			}
		}

		if (Object.keys(updateData).length === 0) {
			toast.info('変更はありません');
			return true;
		}

		// user情報を更新
		let updatedUser: StoreUser;
		try {
			updatedUser = await apiJson<StoreUser>(`/api/users/${targetUserId ?? user?.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(updateData),
			});
		} catch (error) {
			console.error('APIエラー:', error);
			const message = error instanceof Error ? error.message : 'ユーザー情報の更新に失敗しました';
			toast.error(message);
			return false;
		}

		// 自分自身ならセッション再取得
		if (user?.id === targetUserId) {
			if (updateData.password) {
				// パスワードを変更した場合は再ログイン
				const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({
					email: updateData.email ?? (updatedUser.email as string),
					password: updateData.password,
				});

				if (siErr || !siData.session) {
					console.error('再ログイン失敗:', siErr);
					toast.warning(
						'プロフィールは更新されました。次回サインイン時に新しいパスワードでログインしてください。'
					);
				} else {
					document.cookie = `access_token=${siData.session.access_token}; path=/; max-age=86400`;
					sessionStorage.setItem('access_token', siData.session.access_token);
					toast.success('パスワードを更新しました🐷');
				}
			} else if (updateData.email) {
				// パスワードを変更しない場合はセッションだけリフレッシュ
				const { error: refErr } = await supabase.auth.refreshSession();

				if (refErr) {
					console.error('セッションリフレッシュ失敗:', refErr);
					toast.warning(
						'プロフィールは更新されました。再ログインすると最新の認証情報が反映されます。'
					);
				} else {
					toast.success('ユーザー情報を更新しました🐷');
				}
			} else {
				toast.success('ユーザー情報を更新しました🐷');
			}
		}

		// zustand更新
		const { setUser } = useAuthStore.getState();

		if (user?.role === 'parent') {
			if (user.id === targetUserId) {
				setUser(updatedUser); // 親自身
			} else {
				// 子アカウント編集時
				if (updatedUser.role !== 'child') {
					toast.error('子どもユーザー情報の形式が不正です');
					return false;
				}
				const updatedChildren =
					user.children?.map((c) => (c.id === updatedUser.id ? updatedUser : c)) ?? [];
				setUser({ ...user, children: updatedChildren });
				toast.success('こどもユーザー情報を更新しました🐷');
			}
		} else {
			// 子アカウント自身
			setUser(updatedUser);
		}

		return true;
	};

	const onSubmit = async (data: unknown) => {
		let success = false;
		if (mode === 'create') {
			// 子どもアカウントの作成処理
			success = await handleCreate(data as CreateFormData);
		} else if (mode === 'edit') {
			// 自分の編集処理
			success = await handleEdit(data as EditFormData);
		} else if (mode === 'childEdit') {
			// 子どもアカウントの編集処理
			success = await handleEdit(data as EditFormData);
		}
		if (success) onClose();
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="bg-white w-full max-w-lg sm:max-w-xl max-h-screen overflow-auto">
				<DialogHeader>
					<DialogTitle>{dialogTitleMap[mode]}</DialogTitle>
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
						autoComplete="off"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>名まえ</FormLabel>
									<FormControl>
										<Input
											placeholder="名まえを入力してください"
											autoComplete="nickname"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{!isChildSelfEdit && (
							<FormField
								control={form.control}
								name="emailOrId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{isChildAccountMode ? 'ユーザーID' : 'メールアドレス'}</FormLabel>
										<FormControl>
											<Input
												placeholder={
													isChildAccountMode
														? 'ユーザーIDを入力してください'
														: 'メールアドレスを入力してください'
												}
												autoComplete="off"
												data-form-type="other"
												data-lpignore="true"
												data-1p-ignore="true"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{!isChildSelfEdit && (
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>新しいパスワード</FormLabel>
										<FormControl>
											<Input
												placeholder="新しいパスワードを入力してください"
												type="password"
												autoComplete="new-password"
												data-form-type="other"
												data-lpignore="true"
												data-1p-ignore="true"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{isChildSelfEdit && (
							<p className="text-xs text-muted-foreground text-center">
								ユーザーIDとパスワードのへんこうはお父さん・お母さんにおねがいしよう！
							</p>
						)}
						<div className="flex items-center justify-center gap-4">
							<Button type="submit" variant="primary">
								{submitButtonTextMap[mode]}
							</Button>
							{showDeleteButton && (
								<Button type="button" variant="delete" onClick={() => setConfirmOpen(true)}>
									削除
								</Button>
							)}
						</div>
						<DeleteConfirmDialog
							open={confirmOpen}
							onClose={() => setConfirmOpen(false)}
							onCloseAll={onClose}
							targetUserId={targetUserId ?? user?.id}
						/>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};

export default ProfileEditDialog;
