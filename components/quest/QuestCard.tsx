import React from 'react';
import { PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserType } from '@/types/userType';
import { toast } from 'sonner';
import { useQuestList } from '@/hooks/useQuestList';

type QuestCardProps = {
	user: UserType;
};

const QuestCard = ({ user }: QuestCardProps) => {
	const { quests, fetchQuests } = useQuestList();
	const token = sessionStorage.getItem('access_token');

	const handleClickComplete = async (questId: string) => {
		const res = await fetch(`/api/quests/${questId}/complete`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		if (!res.ok) {
			const errorText = await res.text(); // エラーメッセージを取得
			console.error('APIエラー:', errorText);
			toast.error('クエストの更新に失敗しました');
			return;
		}

		toast.success('クエストをかんりょうしました！');
		await fetchQuests();
	};

	return (
		<>
			{quests.map((quest) => {
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
									おこづかい: <span className="quicksand">＋{quest.reward}</span>円
								</p>
							</div>
						</div>
						<div>
							{user?.role === 'parent' ? (
								quest.completed ? (
									<Button type="button" variant="complete" onClick={() => {}}>
										承認
									</Button>
								) : (
									<Button type="button" variant="disabled" onClick={() => {}} disabled>
										未完了
									</Button>
								)
							) : quest.completed ? (
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
