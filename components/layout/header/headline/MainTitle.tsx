import React from 'react';
import type { LucideIcon } from 'lucide-react';

type MainTitleProps = {
	title: string;
	icon: LucideIcon;
};

const MainTitle = ({ title, icon: Icon }: MainTitleProps) => {
	return (
		<div className="flex flex-col items-center mb-8">
			<div className="flex items-center gap-2">
				<Icon size={24} />
				<h2 className="text-2xl font-bold text-center text-gray-800">{title}</h2>
				<Icon size={24} />
			</div>
			<div className="mt-2 w-20 h-0.5 bg-[var(--color-brand)] rounded-full" />
		</div>
	);
};

export default MainTitle;
