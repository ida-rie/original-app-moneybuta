'use client';
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Props = {
	open: boolean;
	onClose: () => void;
};

const DeleteConfirmDialog = ({ open, onClose }: Props) => {
	const handleDelete = async () => {
		// 削除処理
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="bg-white w-[90vw] max-w-sm rounded-md">
				<DialogHeader>
					<DialogTitle>アカウント削除の確認</DialogTitle>
				</DialogHeader>
				<p className="my-4 text-center">
					本当にアカウントを削除してもよろしいですか？この操作は取り消せません。
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
