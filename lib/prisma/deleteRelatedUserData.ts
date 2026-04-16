import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const deleteParentRelatedUserData = async (db: Prisma.TransactionClient, userId: string) => {
	await db.amountHistory.deleteMany({ where: { userId } });
	await db.basicAmount.deleteMany({ where: { userId } });
	await db.questHistory.deleteMany({
		where: {
			baseQuest: {
				userId,
			},
		},
	});
	await db.baseQuest.deleteMany({ where: { userId } });
};

const deleteChildRelatedUserData = async (db: Prisma.TransactionClient, userId: string) => {
	await db.amountHistory.deleteMany({ where: { childUserId: userId } });
	await db.basicAmount.deleteMany({ where: { childUserId: userId } });
	await db.questHistory.deleteMany({ where: { childUserId: userId } });
	await db.baseQuest.deleteMany({ where: { childUserId: userId } });
};

export const deleteRelatedUserDataInTx = async (
	db: Prisma.TransactionClient,
	userId: string,
	role: 'parent' | 'child'
) => {
	if (role === 'parent') {
		await deleteParentRelatedUserData(db, userId);
		return;
	}

	await deleteChildRelatedUserData(db, userId);
};

export const deleteRelatedUserData = async (userId: string, role: 'parent' | 'child') => {
	await prisma.$transaction(async (tx) => {
		await deleteRelatedUserDataInTx(tx, userId, role);
	});
};
