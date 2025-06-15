import { format, subMonths } from 'date-fns';

export const generateRecentMonths = (count: number = 6): string[] => {
	const months: string[] = [];
	for (let i = 0; i < count; i++) {
		const month = subMonths(new Date(), i);
		months.push(format(month, 'yyyy-MM'));
	}
	return months;
};
