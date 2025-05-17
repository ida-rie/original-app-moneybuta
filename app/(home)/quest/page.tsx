'use client';
import React from 'react';
import { Swords } from 'lucide-react';
import QuestCard from '@/components/quest/QuestCard';
import MainTitle from '@/components/layout/header/headline/MainTitle';

const quests = [
	{ id: 1, title: 'おそうじ', price: 50 },
	{ id: 2, title: 'せんたくものをたたむ', price: 50 },
	{ id: 3, title: 'ごはんのおてつだい', price: 80 },
	{ id: 4, title: 'かいもののおてつだい', price: 100 },
];

const Quest = () => {
	return (
		<>
			{/* 見出し */}
			<MainTitle title="おてつだいクエスト" icon={Swords} />
			{/* クエストの表示 */}
			<QuestCard quests={quests} />
		</>
	);
};

export default Quest;
