'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import ProfileEditDialog from './dialog/ProfileEditDialog';
import { UserTypes } from '@/types/userTypes';

type Props = {
	childrenData: UserTypes[];
};

const ChildAccountList = ({ childrenData }: Props) => {
	const [selectedChild, setSelectedChild] = useState<UserTypes | null>(null);
	const [open, setOpen] = useState(false);
	const [mode, setMode] = useState<'childEdit' | 'create'>('childEdit');

	// 変更ボタン
	const handleOpen = (child: UserTypes) => {
		setSelectedChild(child);
		setMode('childEdit');
		setOpen(true);
	};

	// 追加ボタン
	const handleAddChild = () => {
		setSelectedChild(null);
		setMode('create');
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
		setSelectedChild(null);
	};

	return (
		<div className="mt-10 space-y-6 w-2/3 mx-auto">
			{childrenData.length === 0 ? (
				<p className="text-sm text-gray-500">登録されている子どもアカウントはありません。</p>
			) : (
				<ul className="space-y-3">
					{childrenData.map((child) => (
						<li
							key={child.id}
							className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3"
						>
							{/* アイコン＋名前 */}
							<div className="flex items-center gap-3">
								<Image
									src={child.iconUrl ? child.iconUrl : '/icon/ic_pig.png'}
									alt="ユーザーアイコン"
									width={40}
									height={40}
								/>
								<span className="font-bold">{child.name}</span>
							</div>

							{/* 変更ボタン */}
							<div className="flex gap-3 justify-end">
								<Button type="button" variant="primary" onClick={() => handleOpen(child)}>
									変更
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}

			{/* 子どもアカウント追加ボタン */}
			<div className="pt-4">
				<Button type="button" variant="add" onClick={handleAddChild}>
					＋子どもを追加する
				</Button>
			</div>

			<ProfileEditDialog
				open={open}
				onClose={handleClose}
				mode={mode}
				defaultValues={
					mode === 'childEdit' && selectedChild?.email
						? {
								emailOrId: selectedChild.email.includes('@moneybuta.local')
									? selectedChild.email.replace('@moneybuta.local', '')
									: selectedChild.email,
								name: selectedChild.name ?? '',
								password: '',
								iconUrl: selectedChild.iconUrl ?? '/icon/ic_pig.png',
						  }
						: undefined
				}
				targetUserId={selectedChild?.id}
			/>
		</div>
	);
};

export default ChildAccountList;
