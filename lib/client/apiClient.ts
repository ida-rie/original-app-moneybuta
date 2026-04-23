'use client';

type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
	headers?: HeadersInit;
	requireAuth?: boolean;
};

export const apiRequest = async (url: string, options: ApiRequestOptions = {}) => {
	const { requireAuth = true, headers, ...rest } = options;
	const mergedHeaders = new Headers(headers);
	const baseOptions: RequestInit = {
		...rest,
		headers: mergedHeaders,
		credentials: rest.credentials ?? 'include',
	};

	let response = await fetch(url, baseOptions);
	if (!requireAuth || response.status !== 401) {
		return response;
	}

	// access token 失効時は refresh cookie で1回だけ再発行を試みる
	const refreshResponse = await fetch('/api/auth/refresh', {
		method: 'POST',
		credentials: 'include',
	});
	if (!refreshResponse.ok) {
		return response;
	}

	response = await fetch(url, baseOptions);
	return response;
};

export const apiJson = async <T>(url: string, options: ApiRequestOptions = {}) => {
	const response = await apiRequest(url, options);

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		throw new Error(errorText || `Request failed: ${response.status}`);
	}

	return response.json() as Promise<T>;
};
