import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/prisma/supabaseCreateClient';
import { ACCESS_TOKEN_COOKIE_NAME } from '@/lib/auth/cookieConfig';

type AuthResult =
	| {
			user: User;
			errorResponse: null;
	  }
	| {
			user: null;
			errorResponse: NextResponse;
	  };

export const requireAuth = async (
	req: Request | NextRequest,
	options?: {
		missingTokenMessage?: string;
		authErrorMessage?: string;
	}
): Promise<AuthResult> => {
	const bearerToken = req.headers.get('Authorization')?.replace('Bearer ', '');
	const cookieHeader = req.headers.get('cookie') ?? '';
	const cookieToken = cookieHeader
		.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${ACCESS_TOKEN_COOKIE_NAME}=`))
		?.slice(`${ACCESS_TOKEN_COOKIE_NAME}=`.length);
	const accessToken = cookieToken || bearerToken;

	if (!accessToken) {
		return {
			user: null,
			errorResponse: NextResponse.json(
				{ error: options?.missingTokenMessage ?? '認証情報がありません' },
				{ status: 401 }
			),
		};
	}

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser(accessToken);

	if (error || !user) {
		return {
			user: null,
			errorResponse: NextResponse.json(
				{ error: options?.authErrorMessage ?? '認証エラー' },
				{ status: 401 }
			),
		};
	}

	return {
		user,
		errorResponse: null,
	};
};
