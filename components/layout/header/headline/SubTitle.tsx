import React from 'react';
import type { LucideIcon } from 'lucide-react';

type SubTitleProps = {
	title: string;
	icon: LucideIcon;
};

const SubTitle = ({ title, icon: Icon }: SubTitleProps) => {
	return (
		<div className="flex flex-col items-left mb-8">
			<div className="flex items-center gap-1">
				<Icon size={22} />
				<h3 className="text-lg font-bold text-left">{title}</h3>
			</div>
		</div>
	);
};

export default SubTitle;
