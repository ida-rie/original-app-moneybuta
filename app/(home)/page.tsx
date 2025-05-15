import { CurrentAmount } from '@/components/amount/CurrentAmount';
import { IncomeChart } from '@/components/chart/IncomeChart';

const Home = () => {
	return (
		<>
			<CurrentAmount />
			<IncomeChart />
		</>
	);
};

export default Home;
