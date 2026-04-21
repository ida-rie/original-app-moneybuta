type PerfRecord = {
	authMs?: number;
	authzMs?: number;
	dbMs?: number;
	totalMs: number;
	[key: string]: number | undefined;
};

export const logApiPerf = (label: string, values: PerfRecord) => {
	if (process.env.NODE_ENV === 'production') return;

	const parts = Object.entries(values)
		.filter(([, value]) => typeof value === 'number')
		.map(([key, value]) => `${key}=${value}ms`);

	console.info(`[perf] ${label} ${parts.join(' ')}`);
};

