export type MonthlyAmountType = {
	month: string; // "2025-06"
	basicAmount: number;
	rewardSum: number;
	totalAmount: number; // basicAmount + rewardSum
	breakdown: {
		date: string; // "2025-06-01"
		total: number; // その日の合計reward
		items: {
			content: string; // クエスト名
			amount: number; // reward
		}[];
	}[];
};
