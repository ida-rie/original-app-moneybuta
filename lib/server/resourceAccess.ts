import { User } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export const getAuthorizedBasicAmount = async (id: string, user: User) => {
	const basicAmount = await prisma.basicAmount.findUnique({ where: { id } });

	if (!basicAmount) {
		return { basicAmount: null, status: 404 as const, error: '対象の基本金額が見つかりません' };
	}

	if (basicAmount.userId !== user.id) {
		return { basicAmount: null, status: 403 as const, error: '権限がありません' };
	}

	return { basicAmount, status: null, error: null };
};

export const getAuthorizedBaseQuest = async (id: string, user: User) => {
	const baseQuest = await prisma.baseQuest.findUnique({ where: { id } });

	if (!baseQuest) {
		return { baseQuest: null, status: 404 as const, error: 'クエストが見つかりません' };
	}

	if (baseQuest.userId !== user.id) {
		return { baseQuest: null, status: 403 as const, error: '権限がありません' };
	}

	return { baseQuest, status: null, error: null };
};

export const getAuthorizedQuestForApproval = async (id: string, user: User) => {
	const quest = await prisma.questHistory.findUnique({
		where: { id },
		include: { childUser: { select: { parentId: true } } },
	});

	if (!quest) {
		return { quest: null, status: 404 as const, error: 'クエストが見つかりません' };
	}

	if (quest.childUser.parentId !== user.id) {
		return { quest: null, status: 403 as const, error: '権限がありません' };
	}

	return { quest, status: null, error: null };
};

export const getAuthorizedQuestForCompletion = async (id: string, user: User) => {
	const quest = await prisma.questHistory.findUnique({ where: { id } });

	if (!quest) {
		return { quest: null, status: 404 as const, error: 'クエストが見つかりません' };
	}

	if (quest.childUserId !== user.id) {
		return { quest: null, status: 403 as const, error: '権限がありません' };
	}

	return { quest, status: null, error: null };
};
