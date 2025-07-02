'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

	const token = sessionStorage.getItem('access_token');

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

	useEffect(() => {
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

	// 子アカウント作成
	const handleCreate = async (data: CreateFormData) => {
		const { emailOrId, password, name, iconUrl } = data;

		// 子アカウントの場合、ユーザーIDを擬似的にメールアドレス形式にする
		const email = emailOrId.includes('@') ? emailOrId : `${emailOrId}@moneybuta.local`;

		// supabase認証でサインアップ
		const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
			email,
			password,
		});

		if (signUpError) {
			console.error(signUpError);
			toast.error(`登録に失敗しました: ${signUpError.message}`);
			return false;
		}

		// userテーブルに登録するためにidを取得
		const childUser = signUpData.user;

		if (!childUser) {
			toast.error('ユーザー情報が取得できませんでした');
			return false;
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
				iconUrl: iconUrl ?? DEFAULT_ICON,
			}),
		});

		if (!res.ok) {
			const errorText = await res.text(); // エラーメッセージを取得
			console.error('APIエラー:', errorText);
			toast.error('ユーザー情報の登録に失敗しました');
			return false;
		}

		// 作成した子ユーザーの情報を親ユーザーに追加
		const { addChild } = useAuthStore.getState();
		addChild({
			id: childUser.id,
			email,
			name,
			role: 'child',
			iconUrl: selectedIcon ?? null,
		});

		toast.success('子どもユーザーを追加しました🐷');

		return true;
	};

	// ユーザー情報を編集
	const handleEdit = async (data: EditFormData) => {
		const { emailOrId, password, name } = data;

		// 入力（変更）があればメールとして整形
		const email =
			emailOrId && emailOrId.trim() !== ''
				? emailOrId.includes('@')
					? emailOrId
					: `${emailOrId}@moneybuta.local`
				: undefined;

		// 送信データを構築
		const updateData: Record<string, string> = {};

		// 入力（変更）があれば更新データに含める
		if (email) updateData.email = email;
		if (name?.trim()) updateData.name = name.trim();
		if (password?.trim()) updateData.password = password.trim();
		if (selectedIcon?.trim()) updateData.iconUrl = selectedIcon.trim();

		// user情報を更新
		const res = await fetch(`/api/users/${targetUserId ?? user?.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(updateData),
		});

		if (!res.ok) {
			const errorText = await res.text(); // エラーメッセージを取得
			console.error('APIエラー:', errorText);
			toast.error('ユーザー情報の更新に失敗しました');
			return false;
		}

		// 更新されたユーザー情報を取得
		const updatedUser = await res.json();

		// 自分自身ならセッション再取得
		if (user?.id === targetUserId) {
			if (password) {
				// パスワードを変更した場合は再ログイン
				const { data: siData, error: siErr } = await supabase.auth.signInWithPassword({
					email: updatedUser.email as string,
					password,
				});

				if (siErr || !siData.session) {
					console.error('再ログイン失敗:', siErr);
					toast.error('再ログインに失敗しました');
					return false;
				}
				sessionStorage.setItem('access_token', siData.session.access_token);
				toast.success('パスワードを更新しました🐷');
			} else {
				// パスワードを変更しない場合はセッションだけリフレッシュ
				const { error: refErr } = await supabase.auth.refreshSession();

				if (refErr) {
					console.error('セッションリフレッシュ失敗:', refErr);
					toast.error('セッションを更新できませんでした');
					return false;
				}
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
