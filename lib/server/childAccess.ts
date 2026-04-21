import { User } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export const canAccessChild = async (authUser: User, childUserId: string) => {
	const child = await prisma.user.findFirst({
		where: {
			id: childUserId,
			role: 'child',
			OR: [{ id: authUser.id }, { parentId: authUser.id }],
		},
		select: { id: true },
	});

	return !!child;
};

export const canManageChildAsParent = async (authUser: User, childUserId: string) => {
	const child = await prisma.user.findFirst({
		where: {
			id: childUserId,
			role: 'child',
			parent: {
				id: authUser.id,
				role: 'parent',
			},
		},
		select: { id: true },
	});

	return !!child;
};

export const canAccessUser = async (authUser: User, targetUserId: string) => {
	if (authUser.id === targetUserId) {
		return true;
	}

	const targetUser = await prisma.user.findUnique({
		where: { id: targetUserId },
		select: { parentId: true, role: true },
	});

	return targetUser?.role === 'child' && targetUser.parentId === authUser.id;
};
