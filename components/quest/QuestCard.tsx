import React, { useState } from 'react';
import { PiggyBank, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserType } from '@/types/userType';
import { toast } from 'sonner';
import { useQuestList } from '@/hooks/useQuestList';
import { apiRequest } from '@/lib/client/apiClient';

type QuestCardProps = {
	user: UserType;
};

const QuestCard = ({ user }: QuestCardProps) => {
	const { quests, mutateQuests } = useQuestList();
	const [approveLoading, setApproveLoading] = useState<Record<string, boolean>>({});
	const [revokeLoading, setRevokeLoading] = useState<Record<string, boolean>>({});
	const [completeLoading, setCompleteLoading] = useState<Record<string, boolean>>({});

	const patchQuest = (questId: string, patch: Partial<(typeof quests)[number]>) => {
		return (current: typeof quests = []) =>
			current.map((q) => (q.id === questId ? { ...q, ...patch } : q));
	};

	const handleClickComplete = async (questId: string) => {
		setCompleteLoading((prev) => ({ ...prev, [questId]: true }));
		const previousQuests = quests;

		await mutateQuests(patchQuest(questId, { completed: true, completedAt: new Date() }), {
			revalidate: false,
		});

		try {
			const res = await apiRequest(`/api/quests/${questId}/complete`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('APIエラー:', errorText);
				throw new Error(errorText || 'クエストの完了に失敗しました');
			}

			const payload = await res.json();
			const updated = payload?.quest;
			if (updated) {
				await mutateQuests(
					patchQuest(questId, {
						completed: updated.completed,
						completedAt: updated.completedAt ? new Date(updated.completedAt) : new Date(),
					}),
					{ revalidate: false }
				);
			}

			toast.success('クエストをかんりょうしました！');
		} catch (error) {
			console.error('APIエラー:', error);
			await mutateQuests(previousQuests, { revalidate: false });
			toast.error('クエストの完了に失敗しました');
		} finally {
			setCompleteLoading((prev) => ({ ...prev, [questId]: false }));
		}
	};

	const handleClickApprove = async (questId: string) => {
		setApproveLoading((prev) => ({ ...prev, [questId]: true }));
		const previousQuests = quests;

		await mutateQuests(patchQuest(questId, { approved: true }), { revalidate: false });

		try {
			const res = await apiRequest(`/api/quests/${questId}/approve`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('APIエラー:', errorText);
				throw new Error(errorText || 'クエストの承認に失敗しました');
			}

			const payload = await res.json();
			const updated = payload?.quest;
			if (updated) {
				await mutateQuests(
					patchQuest(questId, {
						approved: updated.approved,
						approvedAt: updated.approvedAt ? new Date(updated.approvedAt) : null,
					}),
					{ revalidate: false }
				);
			}

			toast.success('クエストを承認しました！');
		} catch (error) {
			console.error('APIエラー:', error);
			await mutateQuests(previousQuests, { revalidate: false });
			toast.error('クエストの承認に失敗しました');
		} finally {
			setApproveLoading((prev) => ({ ...prev, [questId]: false }));
		}
	};

	const handleClickRevoke = async (questId: string) => {
		setRevokeLoading((prev) => ({ ...prev, [questId]: true }));
		const previousQuests = quests;

		await mutateQuests(
			patchQuest(questId, {
				approved: false,
				approvedAt: null,
			}),
			{ revalidate: false }
		);

		try {
			const res = await apiRequest(`/api/quests/${questId}/approve`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!res.ok) {
				const errorText = await res.text();
				console.error('APIエラー:', errorText);
				throw new Error(errorText || 'クエスト承認の解除に失敗しました');
			}

			const payload = await res.json();
			const updated = payload?.quest;
			if (updated) {
				await mutateQuests(
					patchQuest(questId, {
						approved: updated.approved,
						approvedAt: updated.approvedAt ? new Date(updated.approvedAt) : null,
					}),
					{ revalidate: false }
				);
			}

			toast.success('クエスト承認を解除しました');
		} catch (error) {
			console.error('APIエラー:', error);
			await mutateQuests(previousQuests, { revalidate: false });
			toast.error('クエスト承認の解除に失敗しました');
		} finally {
			setRevokeLoading((prev) => ({ ...prev, [questId]: false }));
		}
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
								// 1. 子が未完了
								!quest.completed ? (
									<Button type="button" variant="disabled" disabled>
										未完了
									</Button>
								) : // 2. 子が完了したが、まだ親が承認していない
								!quest.approved ? (
									<Button
										type="button"
										variant="complete"
										onClick={() => handleClickApprove(quest.id)}
										disabled={approveLoading[quest.id]}
									>
										{approveLoading[quest.id] ? '送信中…' : '承認'}
									</Button>
									) : (
										// 3. 親が承認済み
										<Button
											type="button"
											variant="incomplete"
											onClick={() => handleClickRevoke(quest.id)}
											disabled={revokeLoading[quest.id]}
											className="flex items-center gap-1"
										>
											<Check size={16} />
											{revokeLoading[quest.id] ? '送信中…' : '承認解除'}
										</Button>
									)
								) : // 子どもの表示はそのまま
							quest.completed ? (
								<Button type="button" variant="complete" className="pointer-events-none">
									クリア！
								</Button>
							) : (
								<Button
									type="button"
									variant="incomplete"
									onClick={() => handleClickComplete(quest.id)}
									disabled={completeLoading[quest.id]}
								>
									{completeLoading[quest.id] ? '送信中…' : 'やったよ'}
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
