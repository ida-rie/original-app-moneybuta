import { startOfDay, endOfDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

type DayType = { start: Date; end: Date };

/**
 * 指定した日付文字列（"YYYY-MM-DD"）または
 * 引数なしなら「今日」の JST 0:00〜23:59:59 を
 * UTC に変換した範囲を返す
 */
export const getTodayUtc = (dateStr?: string): DayType => {
	// 日本時間を明示的に指定
	const JAPAN_TZ = 'Asia/Tokyo';
	const baseDate = dateStr
		? new Date(`${dateStr}T00:00:00+09:00`)
		: utcToZonedTime(new Date(), JAPAN_TZ);

	// 日本時間を取得
	const startJst = startOfDay(baseDate);
	const endJst = endOfDay(baseDate);

	const start = zonedTimeToUtc(startJst, JAPAN_TZ);
	const end = zonedTimeToUtc(endJst, JAPAN_TZ);

	// UTCに変換したものをリターン
	return { start, end };
};
