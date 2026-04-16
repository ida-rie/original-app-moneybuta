import { NextRequest, NextResponse } from 'next/server';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/prisma/supabaseCreateClient';

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
	const accessToken = req.headers.get('Authorization')?.replace('Bearer ', '');

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
