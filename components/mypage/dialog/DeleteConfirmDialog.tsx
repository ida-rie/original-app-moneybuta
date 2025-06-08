'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/zustand/authStore';

type Props = {
	open: boolean;
	onClose: () => void;
	onCloseAll?: () => void;
	targetUserId?: string;
};
const DeleteConfirmDialog = ({ open, onClose, onCloseAll, targetUserId }: Props) => {
	const router = useRouter();

	const user = useAuthStore((state) => state.user);
	const token = sessionStorage.getItem('access_token');

	// ユーザー情報を削除
	const handleDelete = async () => {
		let success = false;
		const idToDelete = targetUserId ?? user?.id;

		if (!token || !idToDelete) {
			toast.error('認証情報またはユーザー情報が不足しています');
			return;
		}

		// user情報を削除
		const res = await fetch(`/api/users/${targetUserId ?? user?.id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			const errorText = await res.text(); // エラーメッセージを取得
			console.error('APIエラー:', errorText);
			toast.error('ユーザー情報の削除に失敗しました');
			return;
		}
		success = true;

		// 自分自身が削除された場合はログアウト → ダイアログ閉じて → サインイン画面へ遷移
		if (success) {
			if (idToDelete === user?.id) {
				useAuthStore.getState().clearUser();
				onClose();
				router.push('/signin');
			} else {
				// 子アカウント削除時（必要なら Zustand 更新）
				useAuthStore.getState().removeChild(idToDelete);
				onClose();
				onCloseAll?.();
			}
		}

		toast.success('ユーザー情報を削除しました');

		return;
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="bg-white w-[90vw] max-w-sm rounded-md">
				<DialogHeader>
					<DialogTitle>アカウント削除の確認</DialogTitle>
				</DialogHeader>
				<p className="my-4 text-center">
					本当にアカウントを削除してもよろしいですか？
					<br />
					この操作は取り消せません。
				</p>
				<div className="flex justify-center gap-4">
					<Button variant="primary" onClick={onClose}>
						キャンセル
					</Button>
					<Button variant="delete" onClick={handleDelete}>
						削除する
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteConfirmDialog;
