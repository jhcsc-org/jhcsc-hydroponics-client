import { Card, Grid, useTheme } from "@aws-amplify/ui-react";
import { CombinedSensorChart } from "./CombinedSensorChart";
import { SensorChartsGrid } from "./SensorChartsGrid";

interface DashboardPanelsProps {
	temperatureData: number[];
	phData: number[][];
	humidityData: number[];
	lightData: number[];
	isLoading: boolean;
}

export function DashboardPanels({
	temperatureData,
	phData,
	humidityData,
	lightData,
	isLoading,
}: DashboardPanelsProps) {
	const { tokens } = useTheme();

	return (
		<Grid gap={tokens.space.medium} width="relative.full">
			<Card
				variation="outlined"
				backgroundColor={tokens.colors.background.primary}
				borderColor={tokens.colors.border.secondary}
				padding={tokens.space.large}
			>
				<CombinedSensorChart
					temperatureData={temperatureData}
					phData={phData}
					humidityData={humidityData}
					lightData={lightData}
				/>
			</Card>
			{/* Individual Sensor Charts */}
			<SensorChartsGrid
				temperatureData={temperatureData}
				phData={phData}
				humidityData={humidityData}
				lightData={lightData}
				isLoading={isLoading}
			/>
		</Grid>
	);
}
