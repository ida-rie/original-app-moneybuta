import { startOfMonth, endOfMonth } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export const getMonthUtc = (monthStr: string) => {
	const JAPAN_TZ = 'Asia/Tokyo';
	// JST でのその月1日 0:00
	const jstStart = utcToZonedTime(new Date(`${monthStr}-01T00:00:00+09:00`), JAPAN_TZ);
	// JST でのその月末 23:59:59
	const jstEnd = endOfMonth(jstStart);

	const start = zonedTimeToUtc(startOfMonth(jstStart), JAPAN_TZ);
	const end = zonedTimeToUtc(jstEnd, JAPAN_TZ);

	return { start, end };
};
