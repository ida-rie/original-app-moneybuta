import React from 'react';
import { ShieldUser } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';

const MyPage = () => {
	return (
		<>
			{/* 見出し */}
			<MainTitle title="マイページ" icon={ShieldUser} />
		</>
	);
};

export default MyPage;
