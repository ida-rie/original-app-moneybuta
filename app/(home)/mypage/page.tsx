import React from 'react';
import { ShieldUser } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';
import UserProfile from '@/components/mypage/UserProfile';
import ChildAccountList from '@/components/mypage/ChildAccountList';
import { Smile } from 'lucide-react';

//test用データ
const dummyChildren = [
	{
		userId: 'child_1',
		username: 'さくら',
		userIconUrl: '',
	},
	{
		userId: 'child_2',
		username: 'はると',
		userIconUrl: '',
	},
	{
		userId: 'child_3',
		username: 'みゆ',
		userIconUrl: '',
	},
];

const MyPage = () => {
	return (
		<>
			{/* 見出し */}
			<MainTitle title="マイページ" icon={ShieldUser} />
			<UserProfile userIconUrl="" />
			<div className="mt-10">
				<MainTitle title="子供アカウントの一覧" icon={Smile} />
				<ChildAccountList childrenData={dummyChildren} />
			</div>
		</>
	);
};

export default MyPage;
