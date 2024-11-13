import { Flex, Label, View, useTheme } from "@aws-amplify/ui-react";
import { type FC, memo, useMemo } from "react";
import {
	Area,
	Bar,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { DEFAULT_COLORS } from "../../../constants/chart-colors";
import { useSettings } from "../../../context/SettingsContext";

interface CombinedSensorChartProps {
	temperatureData: number[];
	phData: number[][];
	humidityData: number[];
	lightData: number[];
	maxPoints?: number;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		value: number | null;
		name: string;
		color: string;
	}>;
	label?: string;
}

const CustomTooltip: FC<CustomTooltipProps> = memo(
	({ active, payload, label }) => {
		const { tokens } = useTheme();

		if (!active || !payload || !label) return null;

		return (
			<View
				backgroundColor={tokens.colors.background.primary}
				padding="small"
				borderRadius="medium"
				boxShadow="0 2px 5px rgba(0,0,0,0.1)"
				borderWidth="1px"
				borderStyle="solid"
				borderColor={tokens.colors.border.primary}
			>
				<Label
					fontSize={tokens.fontSizes.small}
					fontWeight={tokens.fontWeights.semibold}
					color={tokens.colors.font.secondary}
					marginBottom="xxs"
				>
					{label}
				</Label>
				{payload.map((entry, index) => (
					<Flex
						key={`${entry.name}-${index}`}
						alignItems="center"
						gap="xxs"
						marginTop="xxs"
					>
						<View
							width="12px"
							height="12px"
							backgroundColor={entry.color}
							borderRadius="50%"
						/>
						<Label
							fontSize={tokens.fontSizes.small}
							color={tokens.colors.font.primary}
						>
							{entry.name}:{" "}
							{entry.value === null ? "N/A" : entry.value.toFixed(2)}
						</Label>
					</Flex>
				))}
			</View>
		);
	},
);

export const CombinedSensorChart: FC<CombinedSensorChartProps> = memo(
	({ temperatureData, phData, humidityData, lightData, maxPoints = 60 }) => {
		const { tokens } = useTheme();
		const { settings } = useSettings();

		const processedData = useMemo(() => {
			const processedTemp = settings.temperatureUnit === "fahrenheit"
				? temperatureData.map(temp => (temp * 9/5) + 32)
				: temperatureData;

			const processedLight = settings.lightUnit === "percentage"
				? lightData.map(lux => Math.min(100, (lux / 1000) * 100))
				: lightData;

			const processedPh = phData.map((sensorData, index) =>
				sensorData.map(value => {
					const sensorId = `sensor${index + 1}`;
					const calibration = settings.phSensorCalibration[sensorId];
					if (!calibration) return value;
					return value * calibration.slope + calibration.offset;
				})
			);

			const dataLength = Math.min(
				maxPoints,
				processedTemp.length,
				humidityData.length,
				processedLight.length,
				...processedPh.map((data) => data.length),
			);

			return Array.from({ length: dataLength }, (_, index) => {
				const timeAgo = (dataLength - index - 1) * 5;
				const dataIndex = (data: number[]) => data.length - 1 - index;

				return {
					time: `${timeAgo}s ago`,
					temperature: processedTemp[dataIndex(processedTemp)] ?? null,
					humidity: humidityData[dataIndex(humidityData)] ?? null,
					light: processedLight[dataIndex(processedLight)]
						? 100 - processedLight[dataIndex(processedLight)]
						: null,
					ph1: processedPh[0][dataIndex(processedPh[0])] ?? null,
					ph2: processedPh[1][dataIndex(processedPh[1])] ?? null,
					ph3: processedPh[2][dataIndex(processedPh[2])] ?? null,
					ph4: processedPh[3][dataIndex(processedPh[3])] ?? null,
				};
			});
		}, [temperatureData, phData, humidityData, lightData, settings]);

		const hasData = useMemo(() => {
			return processedData.some(
				(point) =>
					point.temperature !== null ||
					point.humidity !== null ||
					point.light !== null ||
					point.ph1 !== null ||
					point.ph2 !== null ||
					point.ph3 !== null ||
					point.ph4 !== null,
			);
		}, [processedData]);

		if (!hasData) {
			return (
				<Flex
					height="400px"
					direction="column"
					alignItems="center"
					justifyContent="center"
				>
					<Label
						fontSize={tokens.fontSizes.large}
						color={tokens.colors.font.secondary}
					>
						No sensor data available
					</Label>
					<Label
						fontSize={tokens.fontSizes.small}
						color={tokens.colors.font.tertiary}
						marginTop="xs"
					>
						Waiting for readings...
					</Label>
				</Flex>
			);
		}

		return (
			<ResponsiveContainer width="100%" height={400}>
				<ComposedChart data={processedData}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke={tokens.colors.border.secondary.value}
						opacity={0.5}
					/>
					<XAxis
						dataKey="time"
						stroke={tokens.colors.font.secondary.value}
						tick={{ fontSize: 12 }}
						tickMargin={8}
					/>
					<YAxis
						yAxisId="temperature"
						orientation="left"
						domain={[0, 100]}
						stroke={DEFAULT_COLORS.temperature}
						tick={{ fontSize: 12 }}
						tickMargin={8}
						label={{
							value: "Temperature (°C)",
							angle: -90,
							position: "insideLeft",
							style: {
								fontSize: 12,
								fill: DEFAULT_COLORS.temperature,
							},
						}}
					/>
					<YAxis
						yAxisId="humidity"
						orientation="right"
						domain={[0, 100]}
						stroke={DEFAULT_COLORS.humidity}
						tick={{ fontSize: 12 }}
						tickMargin={8}
						label={{
							value: "Humidity (%)",
							angle: 90,
							position: "insideRight",
							offset: 20,
							style: {
								fontSize: 12,
								fill: DEFAULT_COLORS.humidity,
							},
						}}
					/>
					<YAxis
						yAxisId="ph"
						orientation="right"
						domain={[0, 14]}
						stroke={DEFAULT_COLORS.ph_levels[0]}
						tick={{ fontSize: 12 }}
						tickMargin={16}
						label={{
							value: "pH Level",
							angle: 90,
							position: "insideRight",
							offset: 25,
							style: {
								fontSize: 12,
								fill: DEFAULT_COLORS.ph_levels[0],
							},
						}}
					/>
					<Tooltip content={<CustomTooltip />} />
					<Legend
						verticalAlign="top"
						height={36}
						wrapperStyle={{
							fontSize: "12px",
							paddingBottom: "8px",
						}}
					/>

					{/* Temperature Line */}
					<Line
						yAxisId="temperature"
						type="monotone"
						dataKey="temperature"
						stroke={DEFAULT_COLORS.temperature}
						name="Temperature (°C)"
						dot={false}
						strokeWidth={2}
						connectNulls
					/>

					{/* Humidity Area */}
					<Area
						yAxisId="humidity"
						type="monotone"
						dataKey="humidity"
						fill={DEFAULT_COLORS.humidity}
						stroke={DEFAULT_COLORS.humidity}
						fillOpacity={0.3}
						name="Humidity (%)"
						connectNulls
					/>

					{/* Light Level Bars */}
					<Bar
						yAxisId="humidity"
						dataKey="light"
						fill={DEFAULT_COLORS.light_level}
						name="Light Level (Lux)"
						opacity={0.8}
					/>

					{/* pH Sensor Lines */}
					{[1, 2, 3, 4].map((sensorNum) => (
						<Line
							key={`ph${sensorNum}`}
							yAxisId="ph"
							type="monotone"
							dataKey={`ph${sensorNum}`}
							stroke={
								DEFAULT_COLORS.ph_levels[
									(sensorNum - 1) % DEFAULT_COLORS.ph_levels.length
								]
							}
							name={`pH Sensor ${sensorNum}`}
							dot={false}
							strokeWidth={1.5}
							connectNulls
						/>
					))}
				</ComposedChart>
			</ResponsiveContainer>
		);
	},
);

CustomTooltip.displayName = "CustomTooltip";
CombinedSensorChart.displayName = "CombinedSensorChart";
