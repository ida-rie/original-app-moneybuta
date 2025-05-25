'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '../ui/button';
import ProfileEditDialog from './dialog/ProfileEditDialog';
// import { UserRound } from 'lucide-react';

type UserProfileProps = {
	// name: string;
	// userId: string;
	// role: string;
	userIconUrl?: string;
};

// テスト用
const role = '親';

const UserProfile = ({ userIconUrl }: UserProfileProps) => {
	const [open, setOpen] = useState(false);

	return (
		<>
			<div className="m-auto w-full md:w-2/3 bg-white p-6 rounded-2xl shadow-md">
				<h2 className="text-2xl font-bold mb-6 border-b border-[var(--color-accent)] pb-2">
					ユーザープロフィール
				</h2>

				<div className="flex flex-col md:flex-row items-center md:items-start gap-6">
					{/* アイコンと名前 */}
					<div className="flex flex-col items-center text-center w-full md:w-auto">
						<Image
							src={userIconUrl ? userIconUrl : '/icon/ic_pig.png'}
							alt="ユーザーアイコン"
							width={120}
							height={120}
						/>
						<p className="mt-2 text-xl font-semibold">太郎</p>
						<span
							className={`mt-1 px-3 py-1 text-sm rounded-full ${
								role === '親' ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-secondary)]'
							}`}
						>
							おや
						</span>
					</div>

					{/* ユーザー情報 */}
					<div className="flex-1 w-full text-base">
						<dl className="mb-4">
							<dt className="font-semibold text-[var(--color-text-secondary)] mb-1">名まえ</dt>
							<dd className="text-lg">太郎</dd>
						</dl>
						<dl className="mb-4">
							<dt className="font-semibold text-[var(--color-text-secondary)] mb-1">ユーザーID</dt>
							<dd className="text-lg break-all">test@test.com</dd>
						</dl>
						<dl className="mb-4">
							<dt className="font-semibold text-[var(--color-text-secondary)] mb-1">
								アカウントのしゅるい
							</dt>
							<dd className="text-lg">親</dd>
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
						username: '太郎',
						userId: 'test@test.com',
						password: 'xxxx',
						userIconUrl: '',
					}}
				/>
			</div>
		</>
	);
};

export default UserProfile;
