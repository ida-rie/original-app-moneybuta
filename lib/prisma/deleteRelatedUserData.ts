// lib/prisma/deleteRelatedUserData.ts
import { prisma } from '@/lib/prisma';

export const deleteRelatedUserData = async (userId: string, role: 'parent' | 'child') => {
	if (role === 'parent') {
		await prisma.amountHistory.deleteMany({ where: { userId } });
		await prisma.basicAmount.deleteMany({ where: { userId } });
		await prisma.questHistory.deleteMany({
			where: {
				baseQuest: {
					userId: userId,
				},
			},
		});
		await prisma.baseQuest.deleteMany({ where: { userId } });
	} else {
		await prisma.amountHistory.deleteMany({ where: { childUserId: userId } });
		await prisma.basicAmount.deleteMany({ where: { childUserId: userId } });
		await prisma.questHistory.deleteMany({ where: { childUserId: userId } });
		await prisma.baseQuest.deleteMany({ where: { childUserId: userId } });
	}
};
