export type UserTypes = {
	id: string;
	email: string;
	name: string;
	role: 'parent' | 'child';
	parentId?: string;
	iconUrl?: string;
	createdAt: string;
};
