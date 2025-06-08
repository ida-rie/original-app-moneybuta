'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import ProfileEditDialog from './dialog/ProfileEditDialog';
import { UserTypes } from '@/types/userTypes';

type UserProfileProps = {
	user: UserTypes | null;
};

const UserProfile = ({ user }: UserProfileProps) => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="m-auto w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-md">
				<h2 className="text-2xl font-bold mb-6 border-b border-[var(--color-accent)] pb-2">
					ユーザープロフィール
				</h2>

				<div className="flex flex-col md:flex-row items-center gap-6">
					{/* アイコンと名前 */}
					<div className="flex flex-col items-center text-center w-full md:w-auto">
						<Image
							src={user?.iconUrl ? user?.iconUrl : '/icon/ic_pig.png'}
							alt="ユーザーアイコン"
							width={160}
							height={160}
						/>
					</div>

					{/* ユーザー情報 */}
					<div className="flex-1 w-full text-base">
						<dl className="mb-4">
							<dt className="font-semibold text-[var(--color-text-secondary)] mb-1">名まえ</dt>
							<dd className="text-lg">{user?.name}</dd>
						</dl>
						<dl className="mb-4">
							<dt className="font-semibold text-[var(--color-text-secondary)] mb-1">ユーザーID</dt>
							<dd className="text-lg break-all">{user?.email}</dd>
						</dl>
						<dl className="mb-4">
							<dt className="font-semibold text-[var(--color-text-secondary)] mb-1">
								アカウントのしゅるい
							</dt>
							<dd className="text-lg">
								{user?.role === 'parent' ? '親アカウント' : '子どもアカウント'}
							</dd>
						</dl>
					</div>
				</div>
			</div>

			<div className="mt-10 text-center">
				<Button type="button" variant="primary" onClick={() => setOpen(true)}>
					へんこうする
				</Button>
				<ProfileEditDialog
					open={open}
					onClose={() => setOpen(false)}
					mode="edit"
					defaultValues={{
						emailOrId:
							user?.role === 'child'
								? user?.email?.replace('@moneybuta.local', '') ?? ''
								: user?.email ?? '',
						name: user?.name ?? '',
						password: '',
						iconUrl: user?.iconUrl ?? '',
					}}
					targetUserId={user?.id}
				/>
			</div>
		</>
	);
};

export default UserProfile;
