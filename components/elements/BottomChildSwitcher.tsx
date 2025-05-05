import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Smile } from 'lucide-react';

const BottomChildSwitcher = () => {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<button className="flex flex-col items-center text-xs">
					<Smile size={20} />
					こども
				</button>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="bg-[var(--color-background)] border-t border-gray-200 rounded-t-xl"
			>
				<SheetHeader>
					<SheetTitle>こどもを選択</SheetTitle>
				</SheetHeader>
				<div className="flex flex-col space-y-4 py-4">
					{/* 自由に選択肢を構成 */}
					<button className="mx-4 px-4 py-3 text-center text-base font-bold rounded-lg bg-[var(--color-accent)] text-white transition">
						太郎
					</button>
					<button className="mx-4 px-4 py-3 text-center text-base font-bold rounded-lg bg-[var(--color-accent)] text-white transition">
						花子
					</button>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default BottomChildSwitcher;
