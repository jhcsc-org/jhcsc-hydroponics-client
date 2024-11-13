import { Card, Placeholder, useTheme } from "@aws-amplify/ui-react";
import type { CurveType } from "recharts/types/shape/Curve";
import { useSettings } from "../../../context/SettingsContext";
import { StreamingChart } from "../../charts/StreamingChart";

interface SensorChartProps {
	data: number[];
	label: string;
	unit: string;
	color: string;
	isLoading: boolean;
	isPh?: boolean;
	minValue: number;
	maxValue: number;
	type?: CurveType;
}

export function SensorChart({
	data,
	label,
	unit,
	color,
	isLoading,
	isPh = false,
	minValue,
	maxValue,
	type = "linear",
}: SensorChartProps) {
	const { tokens } = useTheme();
	const { settings } = useSettings();

	// Apply calibration if it's a pH sensor
	const calibratedData = isPh
		? data.map((value) => {
				const sensorNumber = label.match(/\d+/)?.[0];
				if (!sensorNumber) return value;
				
				const calibration = settings.phSensorCalibration[`sensor${sensorNumber}`];
				if (!calibration) return value;
				
				return value * calibration.slope + calibration.offset;
			})
		: data;

	return (
		<Card
			variation="outlined"
			backgroundColor={tokens.colors.background.primary}
			borderColor={tokens.colors.border.secondary}
			padding={tokens.space.large}
			width="relative.full"
		>
			{isLoading ? (
				<Placeholder size="large" />
			) : (
				<StreamingChart
					type={type}
					data={calibratedData}
					label={label}
					unit={unit}
					color={color}
					updateInterval={1000}
					maxPoints={60}
					minValue={minValue}
					maxValue={maxValue}
					stepSize={1}
					isPh={isPh}
				/>
			)}
		</Card>
	);
}
