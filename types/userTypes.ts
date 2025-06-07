export type UserTypes = {
	id: string;
	email: string;
	name: string;
	role: 'parent' | 'child';
	parentId?: string | null;
	iconUrl?: string | null;
	children?: UserTypes[];
};
