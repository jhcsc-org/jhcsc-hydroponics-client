import { Grid, useTheme } from "@aws-amplify/ui-react";
import { SensorValueCard } from "../cards/SensorValueCard";

interface SensorValueCardsGridProps {
	temperatureData: number[];
	phData: number[][];
	humidityData: number[];
	lightData: number[];
	isLoading: boolean;
}

export function SensorValueCardsGrid({
	temperatureData,
	phData,
	humidityData,
	lightData,
	isLoading,
}: SensorValueCardsGridProps) {
	const { tokens } = useTheme();

	const currentTemp = temperatureData[temperatureData.length - 1] ?? null;
	const currentHumidity = humidityData[humidityData.length - 1] ?? null;
	const currentLight =
		lightData.length > 0 ? 100 - lightData[lightData.length - 1] : null;
	const currentPhValues = phData.map(
		(history) => history[history.length - 1] ?? null,
	);

	return (
		<Grid
			columnGap={tokens.space.medium}
			rowGap={tokens.space.medium}
			templateColumns="1fr 1fr 1fr 1fr"
		>
			<SensorValueCard
				value={currentTemp}
				label="Temperature"
				unit="°C"
				isLoading={isLoading}
			/>
			<SensorValueCard
				value={currentHumidity}
				label="Humidity"
				unit="%"
				isLoading={isLoading}
			/>
			<SensorValueCard
				value={currentLight}
				label="Light Level"
				unit="Lux"
				isLoading={isLoading}
			/>
			<SensorValueCard
				value={currentPhValues[0]}
				label="pH Sensor 1"
				unit="pH"
				isLoading={isLoading}
			/>
		</Grid>
	);
}
