import React, { useState } from 'react';
import { PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';

type QuestType = {
	id: number;
	title: string;
	price: number;
};
type QuestCardProps = {
	quests: QuestType[];
};

const QuestCard = ({ quests }: QuestCardProps) => {
	const [completedQuests, setCompletedQuests] = useState<Record<number, boolean>>({});
	// テスト用の親判定
	const isParent = false;

	const handleClickComplete = (id: number) => {
		setCompletedQuests((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};
	return (
		<>
			{quests.map((quest) => {
				const isCompleted = completedQuests[quest.id] ?? false;

				return (
					<div
						key={quest.id}
						className="p-4 rounded-xl shadow bg-[var(--color-card-bg)] flex flex-col justify-between items-center gap-4 mb-4 sm:flex-row"
					>
						<div>
							<p className="text-lg font-bold mb-2">{quest.title}</p>
							<div className="flex items-center gap-1 text-sm">
								<PiggyBank size={23} color="var(--color-secondary)" />
								<p>
									おこづかい: <span className="quicksand">＋{quest.price}</span>円
								</p>
							</div>
						</div>
						<div>
							{isParent ? (
								isCompleted ? (
									<Button type="button" variant="complete" onClick={() => {}}>
										承認
									</Button>
								) : (
									<Button type="button" variant="disabled" onClick={() => {}} disabled>
										未完了
									</Button>
								)
							) : isCompleted ? (
								<Button
									type="button"
									variant="complete"
									onClick={() => handleClickComplete(quest.id)}
								>
									クリア！
								</Button>
							) : (
								<Button
									type="button"
									variant="incomplete"
									onClick={() => handleClickComplete(quest.id)}
								>
									やったよ
								</Button>
							)}
						</div>
					</div>
				);
			})}
		</>
	);
};

export default QuestCard;
