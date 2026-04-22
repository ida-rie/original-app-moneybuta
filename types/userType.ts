export type UserType = {
	id: string;
	email: string;
	loginId?: string | null;
	name: string;
	role: 'parent' | 'child';
	parentId?: string | null;
	iconUrl?: string | null;
	children?: UserType[];
};
