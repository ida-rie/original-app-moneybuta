'use client';

type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
	headers?: HeadersInit;
	requireAuth?: boolean;
};

const getAccessToken = () => {
	if (typeof window === 'undefined') return null;
	return sessionStorage.getItem('access_token');
};

export const apiRequest = async (url: string, options: ApiRequestOptions = {}) => {
	const { requireAuth = true, headers, ...rest } = options;
	const mergedHeaders = new Headers(headers);

	if (requireAuth) {
		const token = getAccessToken();
		if (!token) {
			throw new Error('アクセストークンが見つかりません');
		}
		mergedHeaders.set('Authorization', `Bearer ${token}`);
	}

	return fetch(url, {
		...rest,
		headers: mergedHeaders,
	});
};

export const apiJson = async <T>(url: string, options: ApiRequestOptions = {}) => {
	const response = await apiRequest(url, options);

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		throw new Error(errorText || `Request failed: ${response.status}`);
	}

	return response.json() as Promise<T>;
};
