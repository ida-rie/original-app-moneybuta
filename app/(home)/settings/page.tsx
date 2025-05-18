import React from 'react';
import { Settings } from 'lucide-react';
import MainTitle from '@/components/layout/header/headline/MainTitle';

const Setting = () => {
	return (
		<>
			{/* 見出し */}
			<MainTitle title="各種設定" icon={Settings} />
		</>
	);
};

export default Setting;
