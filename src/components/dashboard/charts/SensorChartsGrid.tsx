import { Grid, Placeholder, useTheme } from "@aws-amplify/ui-react";
import { DEFAULT_COLORS } from "../../../constants/chart-colors";
import { useSettings } from "../../../context/SettingsContext";
import { SensorChart } from "./SensorChart";

interface SensorChartsGridProps {
	temperatureData: number[];
	phData: number[][];
	humidityData: number[];
	lightData: number[];
	isLoading: boolean;
}

export function SensorChartsGrid({
	temperatureData,
	phData,
	humidityData,
	lightData,
	isLoading,
}: SensorChartsGridProps) {
	const { tokens } = useTheme();
	const { settings } = useSettings();

	// Convert light data based on settings
	const processedLightData = settings.lightUnit === "percentage"
		? lightData.map(value => Math.min(100, (value / 1000) * 100))
		: lightData;

	return (
		<Grid gap={tokens.space.medium}>
			<SensorChart
				key="temperature"
				data={temperatureData}
				label="Temperature"
				unit={settings.temperatureUnit === "fahrenheit" ? "°F" : "°C"}
				color={DEFAULT_COLORS.temperature}
				isLoading={isLoading}
				minValue={settings.temperatureUnit === "fahrenheit" ? 32 : 0}
				maxValue={settings.temperatureUnit === "fahrenheit" ? 212 : 100}
			/>
			<SensorChart
				key="humidity"
				data={humidityData}
				label="Humidity"
				unit="%"
				color={DEFAULT_COLORS.humidity}
				isLoading={isLoading}
				minValue={0}
				maxValue={100}
			/>
			<SensorChart
				key="light"
				data={processedLightData}
				label="Light Level"
				unit={settings.lightUnit}
				color={DEFAULT_COLORS.light_level}
				isLoading={isLoading}
				minValue={0}
				maxValue={100}
			/>

			{isLoading ? (
				<Placeholder size="large" />
			) : (
				phData.map((history, sensorIndex) => (
					<SensorChart
						key={`ph-sensor-${sensorIndex + 1}`}
						data={history}
						label={`pH Sensor ${sensorIndex + 1}`}
						unit="pH"
						color={
							DEFAULT_COLORS.ph_levels[
							sensorIndex % DEFAULT_COLORS.ph_levels.length
							]
						}
						isLoading={isLoading}
						minValue={0}
						maxValue={14}
						isPh
					/>
				))
			)}
		</Grid>
	);
}
