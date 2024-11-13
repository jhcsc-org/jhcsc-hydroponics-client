import { Badge, Flex, Label, View, useTheme } from "@aws-amplify/ui-react";
import type { FC } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Area,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { CurveType } from "recharts/types/shape/Curve";
import { useSettings, type Settings } from "../../context/SettingsContext";

// Types
interface StreamingChartProps {
	data: number[];
	label: string;
	unit: string;
	color: string;
	maxPoints: number;
	updateInterval: number;
	minValue?: number;
	maxValue?: number;
	stepSize?: number;
	isPh?: boolean;
	type: CurveType;
}

interface DataPoint {
	value: number | null;
	timestamp: number;
}

interface ChartHeaderProps {
	label: string;
	currentValue: number | null;
	unit: string;
	isPh: boolean;
	tokens: any;
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{
		value: number | null;
		dataKey: string;
		payload: DataPoint;
	}>;
	label?: number;
	unit: string;
}

interface StatisticsProps {
	statistics: { average: string; min: string; max: string } | null;
	unit: string;
	tokens: any;
}

// Utility functions
const getPhColor = (ph: number | null, isPh: boolean, settings: Settings): string => {
	if (!isPh) return "transparent";
	if (ph === null) return "rgba(0, 0, 0, 0.1)";

	const { tooAcidic, slightlyAcidic, slightlyAlkaline, tooAlkaline } = settings.phThresholds;

	if (ph < tooAcidic) return "hsla(0, 75%, 75%, 0.2)";
	if (ph > tooAlkaline) return "hsla(220, 95%, 75%, 0.2)";
	if (ph < slightlyAcidic) return "hsla(30, 75%, 85%, 0.2)";
	if (ph > slightlyAlkaline) return "hsla(200, 75%, 85%, 0.2)";
	return "hsla(130, 60%, 95%, 0.2)";
};

// Memoized Components
const ChartHeader: FC<ChartHeaderProps> = memo(
	({ label, currentValue, unit, isPh, tokens }) => {
		const getPhLevel = useCallback((value: number | null) => {
			if (value === null) return "N/A";
			if (value < 0) return "Extremely Acidic";
			if (value > 14) return "Extremely Alkaline";
			if (value < 7) return "Acidic";
			if (value > 7) return "Alkaline";
			return "Neutral";
		}, []);

		return (
			<Flex
				justifyContent="space-between"
				alignItems="center"
				marginBottom="medium"
				wrap="wrap"
			>
				<Label
					fontSize="x-large"
					fontWeight="bold"
					color={tokens.colors.neutral[90]}
					style={{ marginBottom: "8px" }}
				>
					{label}
				</Label>
				{isPh ? (
					<Badge
						paddingInline="medium"
						borderRadius="small"
						fontSize="large"
						fontWeight="bold"
						backgroundColor={
							currentValue === null
								? tokens.colors.neutral[20]
								: currentValue < 0 || currentValue > 14
									? tokens.colors.red[20]
									: currentValue < 7
										? tokens.colors.red[40]
										: currentValue > 7
											? tokens.colors.blue[40]
											: tokens.colors.green[40]
						}
						color={
							currentValue === null
								? tokens.colors.neutral[80]
								: currentValue < 0 || currentValue > 14
									? tokens.colors.red[80]
									: currentValue < 7
										? tokens.colors.red[90]
										: currentValue > 7
											? tokens.colors.blue[90]
											: tokens.colors.green[90]
						}
					>
						{getPhLevel(currentValue)} (pH:{" "}
						{currentValue === null
							? "N/A"
							: currentValue < 0
								? "< 0"
								: currentValue > 14
									? "> 14"
									: currentValue.toFixed(2)}
						)
					</Badge>
				) : (
					<Label
						fontSize="large"
						fontWeight="bold"
						color={tokens.colors.neutral[80]}
					>
						{currentValue === null
							? "N/A"
							: `${currentValue.toFixed(2)} ${unit}`}
					</Label>
				)}
			</Flex>
		);
	},
);

const CustomTooltip: FC<CustomTooltipProps> = memo(
	({ active, payload, label, unit }) => {
		const { tokens } = useTheme();

		if (active && payload && payload.length && label) {
			const value = payload[0].value;
			const date = new Date(label);

			return (
				<View
					backgroundColor={tokens.colors.background.secondary}
					padding="small"
					borderRadius="medium"
					boxShadow="0 2px 5px rgba(0,0,0,0.1)"
				>
					<div
						style={{
							fontWeight: "bold",
							marginBottom: "8px",
							color: tokens.colors.neutral[80].value,
						}}
					>
						Data Point
					</div>
					<div style={{ color: tokens.colors.neutral[90].value }}>
						{value === null ? (
							`${date.toLocaleString()}: No data`
						) : (
							<>
								<div style={{ marginBottom: "4px" }}>
									{date.toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</div>
								<div style={{ marginBottom: "4px" }}>
									{date.toLocaleTimeString("en-US", {
										hour12: false,
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
									})}
								</div>
								<div style={{ fontWeight: "bold" }}>
									{value.toFixed(2)} {unit}
								</div>
							</>
						)}
					</div>
				</View>
			);
		}
		return null;
	},
);

const Statistics: FC<StatisticsProps> = memo(({ statistics, unit, tokens }) => {
	if (!statistics) return null;

	return (
		<Flex
			justifyContent="space-around"
			alignItems="center"
			marginTop={tokens.space.medium}
			backgroundColor={tokens.colors.background.secondary}
			padding={tokens.space.medium}
			borderRadius={tokens.radii.small}
		>
			{["Average", "Min", "Max"].map((label, index) => (
				<Flex key={label} direction="column" alignItems="center">
					<Label
						fontSize={tokens.fontSizes.medium}
						fontWeight={tokens.fontWeights.bold}
						color={tokens.colors.neutral[80]}
					>
						{label}
					</Label>
					<Label
						fontSize={tokens.fontSizes.large}
						fontWeight={tokens.fontWeights.bold}
						color={
							index === 0
								? tokens.colors.primary[80]
								: index === 1
									? tokens.colors.error
									: tokens.colors.success
						}
					>
						{statistics[label.toLowerCase() as keyof typeof statistics]} {unit}
					</Label>
				</Flex>
			))}
		</Flex>
	);
});

export const StreamingChart: FC<StreamingChartProps> = memo(
	({
		data,
		label,
		unit,
		color,
		maxPoints,
		updateInterval,
		minValue: propMinValue,
		maxValue: propMaxValue,
		stepSize = 1,
		isPh = false,
		type,
	}) => {
		const { tokens } = useTheme();
		const { settings } = useSettings();
		const [dataPoints, setDataPoints] = useState<DataPoint[]>(() => {
			const initialTime = Date.now();
			return Array(maxPoints)
				.fill(null)
				.map((_, i) => ({
					value: null,
					timestamp: initialTime - (maxPoints - 1 - i) * updateInterval,
				}));
		});

		const lastValueRef = useRef<number | null>(null);
		const lastUpdateTimeRef = useRef<number>(Date.now());

		useEffect(() => {
			if (data.length > 0) {
				const now = Date.now();
				lastValueRef.current = data[data.length - 1];
				lastUpdateTimeRef.current = now;
			}
		}, [data]);

		useEffect(() => {
			let animationFrame: number;
			let lastFrameTime = performance.now();

			const animate = (currentTime: number) => {
				const deltaTime = currentTime - lastFrameTime;
				const scrollAmount = deltaTime / updateInterval;

				if (scrollAmount >= 1) {
					lastFrameTime = currentTime;

					setDataPoints((prev) => {
						const newPoints = [...prev.slice(1)];
						const timestamp = Date.now();
						newPoints.push({
							value: lastValueRef.current,
							timestamp,
						});
						return newPoints;
					});
				}

				animationFrame = requestAnimationFrame(animate);
			};

			animationFrame = requestAnimationFrame(animate);
			return () => cancelAnimationFrame(animationFrame);
		}, [updateInterval]);

		const currentValue = useMemo(() => {
			const lastPoint = dataPoints[dataPoints.length - 1];
			return lastPoint?.value ?? null;
		}, [dataPoints]);

		const { minValue, maxValue, summaryStatistics } = useMemo(() => {
			if (isPh) {
				return {
					minValue: propMinValue ?? 0,
					maxValue: propMaxValue ?? 14,
					summaryStatistics: null,
				};
			}

			const validValues = dataPoints
				.map((point) => point.value)
				.filter((value): value is number => value !== null);

			if (validValues.length === 0) {
				return {
					minValue: propMinValue ?? 0,
					maxValue: propMaxValue ?? 100,
					summaryStatistics: null,
				};
			}

			const dataMin = Math.min(...validValues);
			const dataMax = Math.max(...validValues);
			const range = dataMax - dataMin;
			const padding = range * 0.1;

			const avgValue =
				validValues.reduce((sum, val) => sum + val, 0) / validValues.length;

			return {
				minValue:
					propMinValue ?? Math.floor((dataMin - padding) / stepSize) * stepSize,
				maxValue:
					propMaxValue ?? Math.ceil((dataMax + padding) / stepSize) * stepSize,
				summaryStatistics: {
					average: avgValue.toFixed(2),
					min: dataMin.toFixed(2),
					max: dataMax.toFixed(2),
				},
			};
		}, [dataPoints, isPh, propMinValue, propMaxValue, stepSize]);

		// Add loading state
		const [isLoading, setIsLoading] = useState(true);

		useEffect(() => {
			// Simulate initial loading
			const timer = setTimeout(() => setIsLoading(false), 500);
			return () => clearTimeout(timer);
		}, []);

		// Add empty state check
		const isEmpty = useMemo(() => {
			return dataPoints.every((point) => point.value === null);
		}, [dataPoints]);

		return (
			<View width="100%">
				<ChartHeader
					label={label}
					currentValue={currentValue}
					unit={unit}
					isPh={isPh}
					tokens={tokens}
				/>
				<ResponsiveContainer width="100%" height={400}>
					{isLoading ? (
						<Flex
							direction="column"
							alignItems="center"
							justifyContent="center"
							height="100%"
						>
							<Label fontSize="large" color={tokens.colors.neutral[60]}>
								Loading data...
							</Label>
						</Flex>
					) : isEmpty ? (
						<Flex
							direction="column"
							alignItems="center"
							justifyContent="center"
							height="100%"
						>
							<Label fontSize="large" color={tokens.colors.neutral[60]}>
								No data available
							</Label>
							<Label
								fontSize="small"
								color={tokens.colors.neutral[40]}
								marginTop="small"
							>
								Waiting for sensor readings...
							</Label>
						</Flex>
					) : (
						<LineChart
							data={dataPoints}
							margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
							style={{ transition: "all 0.3s ease" }}
						>
							<CartesianGrid
								stroke={"#d3d3d3"}
								strokeDasharray="3 3"
								vertical={false}
							/>
							<XAxis
								dataKey="timestamp"
								type="number"
								domain={["auto", "auto"]}
								scale="time"
								tickFormatter={(tick) =>
									new Date(tick).toLocaleTimeString("en-US", {
										hour12: false,
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
									})
								}
								tick={{ fontSize: 12, fill: "#000" }}
								minTickGap={20}
								axisLine={false}
								tickLine={false}
								padding={{ left: 10, right: 10 }}
							/>
							<YAxis
								domain={[minValue, maxValue]}
								scale="linear"
								tickFormatter={(value: number) =>
									isPh
										? value < 0
											? "< 0"
											: value > 14
												? "> 14"
												: value.toFixed(1)
										: value.toFixed(1)
								}
								tick={{ fontSize: 12, fill: "#000" }}
								axisLine={false}
								tickLine={false}
								padding={{ top: 10, bottom: 10 }}
								label={{
									value: unit,
									angle: -90,
									position: "insideLeft",
									dy: -20,
									fill: "#000",
									fontSize: 14,
									fontWeight: "bold",
								}}
							/>
							<Tooltip content={<CustomTooltip unit={unit} />} />
							<Legend
								verticalAlign="top"
								align="right"
								height={36}
								wrapperStyle={{ fontSize: "14px", color: "#000" }}
							/>
							{isPh && (
								<>
									<ReferenceLine
										y={7}
										stroke={"#000"}
										strokeDasharray="3 3"
										label={{
											value: "Neutral (pH 7)",
											position: "right",
											fill: "#000",
											fontSize: 12,
										}}
									/>
									<Area
										type="monotone"
										dataKey="value"
										stroke="none"
										fill={getPhColor(currentValue, isPh, settings)}
										fillOpacity={1}
										isAnimationActive={true}
									/>
								</>
							)}
							<Line
								type={type}
								dataKey="value"
								stroke={color}
								dot={false}
								strokeWidth={2}
								connectNulls
								isAnimationActive={false}
								name={label}
							/>
						</LineChart>
					)}
				</ResponsiveContainer>
				<Statistics
					statistics={summaryStatistics}
					unit={unit}
					tokens={tokens}
				/>
			</View>
		);
	},
);

StreamingChart.displayName = "StreamingChart";
