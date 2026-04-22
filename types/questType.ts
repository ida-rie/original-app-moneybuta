export type QuestType = {
	id: string;
	title: string;
	reward: number;
	completed: boolean;
	completedAt: Date | string | null;
	approved: boolean;
	approvedAt: Date | string | null;
};
