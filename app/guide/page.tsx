'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// アプリの使い方紹介ページ
const GuidePage = () => {
	const searchParams = useSearchParams();
	const from = searchParams.get('from');
	const context = from === 'mypage' ? 'mypage' : 'auth';

	return (
		<main className="max-w-3xl mx-auto py-10 px-4">
			<h1 className="text-2xl font-bold mb-6">マネぶたアプリの使い方</h1>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-2">👨‍👩‍👧 親ユーザーの場合</h2>
				<ul className="list-disc list-inside space-y-1 text-gray-700">
					<li>新規登録後に子アカウントを作成します（メールアドレスじゃなくログインIDでOK）</li>
					<li>毎月の基本おこづかいを設定します</li>
					<li>お手伝いクエストを作成します</li>
					<li>子どもからの完了申請を承認するとおこづかいに反映されます</li>
				</ul>
			</section>

			<section className="mb-8">
				<h2 className="text-xl font-semibold mb-2">🧒 子どもユーザーの場合</h2>
				<ul className="list-disc list-inside space-y-1 text-gray-700">
					<li>おやからもらったアカウントでログインします</li>
					<li>クエストがおわったら「やったよ」ボタンをおします</li>
					<li>おやが「いいよ」って してくれたら、おこづかいがふえていきます</li>
				</ul>
			</section>

			{context === 'auth' ? (
				<div className="mt-10 flex gap-4">
					<Link href="/signin" className="text-[var(--color-primary)] hover:underline">
						サインインへもどる
					</Link>
					<Link href="/signup" className="text-[var(--color-primary)] hover:underline">
						アカウントを作成する
					</Link>
				</div>
			) : (
				<div className="text-sm text-blue-600 underline">
					<Link href="/mypage">マイページへもどる</Link>
				</div>
			)}
		</main>
	);
};

export default GuidePage;
