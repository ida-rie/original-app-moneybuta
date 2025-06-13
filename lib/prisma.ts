import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// const globalForPrisma = globalThis as unknown as {
// 	prisma: PrismaClient | undefined;
// };

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: ['query'],
//   })

// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Data Proxy 対応の PrismaClient を生成する関数
const createPrisma = () => new PrismaClient().$extends(withAccelerate());

// グローバルキャッシュ用に型を絞った globalThis ラッパー
type PrismaSingleton = { prisma?: ReturnType<typeof createPrisma> };
const glb = globalThis as PrismaSingleton;

// development ではキャッシュを使い、production では常に新規生成
export const prisma =
	process.env.NODE_ENV === 'production' ? createPrisma() : (glb.prisma ??= createPrisma());
