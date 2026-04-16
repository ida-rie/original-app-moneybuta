import { User } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export const canAccessChild = async (authUser: User, childUserId: string) => {
	if (authUser.id === childUserId) {
		const child = await prisma.user.findUnique({
			where: { id: childUserId },
			select: { id: true, role: true },
		});
		return child?.role === 'child';
	}

	const child = await prisma.user.findUnique({
		where: { id: childUserId },
		select: { parentId: true, role: true },
	});

	return child?.role === 'child' && child.parentId === authUser.id;
};

export const canManageChildAsParent = async (authUser: User, childUserId: string) => {
	const parentUser = await prisma.user.findUnique({
		where: { id: authUser.id },
		select: { role: true },
	});

	if (parentUser?.role !== 'parent') {
		return false;
	}

	const child = await prisma.user.findUnique({
		where: { id: childUserId },
		select: { parentId: true, role: true },
	});

	return child?.role === 'child' && child.parentId === authUser.id;
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
