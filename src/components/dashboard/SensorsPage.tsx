import {
	Alert,
	Badge,
	Card,
	Flex,
	Grid,
	Heading,
	Text,
	useTheme,
} from "@aws-amplify/ui-react";
import type { ReactNode } from "react";
import { FiCheckCircle, FiRefreshCw, FiThermometer } from "react-icons/fi";
import { MdOutlineLightMode, MdScience } from "react-icons/md";
import { WiHumidity } from "react-icons/wi";
import { TOPICS } from "../../constants/mqtt-topics";
import { useSettings } from "../../context/SettingsContext";
import { useLatestTelemetryData } from "../../hooks/useLatestTelemetryData";
import { useTelemetryData } from "../../hooks/useTelemetryData";
import { DashboardPanels } from "./charts/RealTimeCharts";

export function SensorsPage() {
	const { tokens } = useTheme();
	const { settings } = useSettings();
	const { temperatureHistory, phHistory, humidityHistory, lightHistory } =
		useTelemetryData(TOPICS.telemetry);
	const latestTelemetryData = useLatestTelemetryData(TOPICS.telemetry);

	// Get latest values from history arrays
	const latestTemp = temperatureHistory[temperatureHistory.length - 1] ?? "--";
	const latestHumidity = humidityHistory[humidityHistory.length - 1] ?? "--";
	const latestLight = lightHistory[lightHistory.length - 1] ?? "--";
	const latestAveragePh = latestTelemetryData?.ph_levels
		? (
				latestTelemetryData.ph_levels.reduce((a, b) => a + b, 0) /
				latestTelemetryData.ph_levels.length
			).toFixed(2)
		: "—";

	// Helper function to convert temperature if needed
	const formatTemperature = (celsius: number) => {
		if (settings.temperatureUnit === "fahrenheit") {
			return ((celsius * 9/5) + 32).toFixed(1) + "°F";
		}
		return celsius.toFixed(1) + "°C";
	};

	// Helper function to format light level
	const formatLightLevel = (lux: number) => {
		if (settings.lightUnit === "percentage") {
			return Math.min(100, Math.round((lux / 1000) * 100)) + "%";
		}
		return lux.toFixed(1) + " lux";
	};

	// Apply pH calibration
	const calibratePh = (rawPh: number, sensorId: string) => {
		const calibration = settings.phSensorCalibration[`sensor${sensorId}`];
		return rawPh * calibration.slope + calibration.offset;
	};

	const renderSensorValue = (
		label: string,
		value: number | string,
		unit: string,
		icon: ReactNode,
	) => (
		<Card
			padding={tokens.space.medium}
			backgroundColor={tokens.colors.background.secondary}
		>
			<Flex direction="column" gap={tokens.space.small}>
				<Flex alignItems="center" gap={tokens.space.xs}>
					{icon}
					<Text color={tokens.colors.font.secondary}>{label}</Text>
				</Flex>
				<Flex alignItems="baseline" gap={tokens.space.xxs}>
					<Text
						fontSize={tokens.fontSizes.xxxl}
						fontWeight={tokens.fontWeights.light}
					>
						{typeof value === 'number' ? 
							label.toLowerCase().includes('temperature') ? formatTemperature(value) :
							label.toLowerCase().includes('light') ? formatLightLevel(value) :
							label.toLowerCase().includes('ph') ? calibratePh(value, label.slice(-1)).toFixed(2) :
							value.toFixed(1) + unit
							: value}
					</Text>
				</Flex>
				<Text
					fontSize={tokens.fontSizes.small}
					color={tokens.colors.font.tertiary}
				>
					Real-time
				</Text>
			</Flex>
		</Card>
	);

	const renderHeader = () => (
		<Flex direction="column" gap={tokens.space.xs}>
			<Flex justifyContent="space-between" alignItems="center">
				<Heading level={2}>Sensor Analytics</Heading>
				<Flex gap={tokens.space.xs} alignItems="center">
					<Badge variation="success">
						<Flex gap={tokens.space.xxs} alignItems="center">
							<FiCheckCircle />
							<Text>Live</Text>
						</Flex>
					</Badge>
				</Flex>
			</Flex>
			<Text color={tokens.colors.font.tertiary}>
				Detailed sensor data and historical trends
			</Text>
			<Text
				color={tokens.colors.font.tertiary}
				fontSize={tokens.fontSizes.small}
			>
				Updated: {new Date().toLocaleTimeString()}
			</Text>
		</Flex>
	);

	return (
		<Flex direction="column" gap={tokens.space.medium}>
			{renderHeader()}
			{/* Main Sensor Values */}
			<Grid
				templateColumns={{
					base: "1fr",
					medium: "1fr 1fr",
					large: "1fr 1fr 1fr 1fr",
				}}
				gap={tokens.space.medium}
			>
				{renderSensorValue(
					"Temperature",
					latestTemp,
					"°C",
					<FiThermometer
						size={20}
						color={tokens.colors.font.secondary.value}
					/>,
				)}
				{renderSensorValue(
					"Humidity",
					latestHumidity,
					"%",
					<WiHumidity size={20} color={tokens.colors.font.secondary.value} />,
				)}
				{renderSensorValue(
					"Light Level",
					latestLight,
					"Lux",
					<MdOutlineLightMode
						size={20}
						color={tokens.colors.font.secondary.value}
					/>,
				)}
				{renderSensorValue(
					"Average pH",
					latestAveragePh,
					"pH",
					<MdScience size={20} color={tokens.colors.font.secondary.value} />,
				)}
			</Grid>

			{/* Main Grid Layout */}
			<Grid
				templateColumns={{ base: "1fr", large: "3fr 1fr" }}
				gap={tokens.space.large}
			>
				{/* Sensor Data Section */}
				<Card padding={tokens.space.xxs}>
					<Flex
						justifyContent="space-between"
						alignItems="center"
						marginBottom={tokens.space.large}
					>
						<Heading level={4}>Real-Time Sensor Data</Heading>
						<Badge
							variation="info"
							backgroundColor={tokens.colors.background.info}
						>
							<Flex gap={tokens.space.xs} alignItems="center">
								<FiRefreshCw />
								<Text>Auto-updating</Text>
							</Flex>
						</Badge>
					</Flex>

					<DashboardPanels
						temperatureData={temperatureHistory}
						phData={phHistory}
						humidityData={humidityHistory}
						lightData={lightHistory}
						isLoading={false}
					/>
				</Card>

				{/* Status Section */}
				<Flex direction="column" gap={tokens.space.medium}>
					{/* Sensor Status */}
					<Card padding={tokens.space.medium}>
						<Heading level={4} marginBottom={tokens.space.medium}>
							Sensor Status
						</Heading>
						<Grid templateColumns="1fr" gap={tokens.space.xs}>
							{[
								{
									label: "Temperature Sensor",
									status: "active",
									lastUpdate: new Date().toLocaleTimeString(),
								},
								{
									label: "pH Sensors",
									status: "active",
									lastUpdate: new Date().toLocaleTimeString(),
								},
								{
									label: "Humidity Sensor",
									status: "active",
									lastUpdate: new Date().toLocaleTimeString(),
								},
								{
									label: "Light Sensor",
									status: "active",
									lastUpdate: new Date().toLocaleTimeString(),
								},
							].map((sensor) => (
								<Alert
									variation="success"
									key={sensor.label}
									isDismissible={false}
									hasIcon={true}
								>
									<Flex
										justifyContent="space-between"
										alignItems="center"
										gap={tokens.space.xs}
									>
										<Text fontSize={tokens.fontSizes.small}>
											{sensor.label}
										</Text>
										<Text
											fontSize={tokens.fontSizes.small}
											color={tokens.colors.font.tertiary}
										>
											{sensor.lastUpdate}
										</Text>
									</Flex>
								</Alert>
							))}
						</Grid>
					</Card>

					{/* Data Quality */}
					<Card padding={tokens.space.medium}>
						<Heading level={4} marginBottom={tokens.space.medium}>
							Data Quality
						</Heading>
						<Alert variation="info" isDismissible={false} hasIcon={true}>
							<Flex direction="column" gap={tokens.space.xs}>
								<Text>All sensors reporting normally</Text>
								<Text
									fontSize={tokens.fontSizes.small}
									color={tokens.colors.font.tertiary}
								>
									Data refresh rate: 5s
								</Text>
							</Flex>
						</Alert>
					</Card>
				</Flex>
			</Grid>
		</Flex>
	);
}
