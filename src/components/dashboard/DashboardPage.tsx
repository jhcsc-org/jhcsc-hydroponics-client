import {
	Badge,
	Card,
	Flex,
	Grid,
	Heading,
	Text,
	useTheme,
} from "@aws-amplify/ui-react";
import {
	PiDropBold,
	PiFlaskBold,
	PiSunDimBold,
	PiThermometerSimpleBold,
} from "react-icons/pi";
import { TOPICS } from "../../constants/mqtt-topics";
import { useSettings } from "../../context/SettingsContext";
import { useLatestTelemetryData } from "../../hooks/useLatestTelemetryData";
import { useTelemetryData } from "../../hooks/useTelemetryData";
import { CombinedSensorChart } from "./charts/CombinedSensorChart";

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

import { generateClient } from "aws-amplify/api";
import { useEffect } from "react";
import { listVerdureTelemetryLogs } from "../../graphql/queries";
/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */

const client = generateClient({
	authMode: "userPool",
});

async function fetchTelemetryData() {
	try {
		const result = await client.graphql({
			query: listVerdureTelemetryLogs,
		});
		console.log('Telemetry data:', result);
	} catch (error) {
		console.error('Error fetching telemetry data:', error);
	}
}

export function DashboardPage() {
	const { tokens } = useTheme();
	const { settings } = useSettings();
	const latestTelemetryData = useLatestTelemetryData(TOPICS.telemetry);
	const { temperatureHistory, phHistory, humidityHistory, lightHistory } =
		useTelemetryData(TOPICS.telemetry);

	// Helper function to determine pH status
	const getPhStatus = (ph: number) => {
		const { tooAcidic, slightlyAcidic, slightlyAlkaline, tooAlkaline } = settings.phThresholds;

		if (ph < tooAcidic) return { label: "Too Acidic", color: tokens.colors.red[60] };
		if (ph > tooAlkaline) return { label: "Too Alkaline", color: tokens.colors.red[60] };
		if (ph < slightlyAcidic) return { label: "Slightly Acidic", color: tokens.colors.yellow[60] };
		if (ph > slightlyAlkaline) return { label: "Slightly Alkaline", color: tokens.colors.yellow[60] };
		return { label: "Optimal", color: tokens.colors.green[60] };
	};

	const statsCards = [
		{
			title: "Temperature",
			value: latestTelemetryData?.temperature?.toFixed(1) ?? "—",
			unit: "°C",
			icon: <PiThermometerSimpleBold size={24} />,
			color: tokens.colors.red[60],
		},
		{
			title: "Humidity",
			value: latestTelemetryData?.humidity?.toString() ?? "—",
			unit: "%",
			icon: <PiDropBold size={24} />,
			color: tokens.colors.blue[60],
		},
		{
			title: "Light Level",
			value: latestTelemetryData?.light_level?.toFixed(1) ?? "—",
			unit: "lux",
			icon: <PiSunDimBold size={24} />,
			color: tokens.colors.yellow[60],
		},
		{
			title: "Average pH",
			value: latestTelemetryData?.ph_levels
				? (
					latestTelemetryData.ph_levels.reduce((a, b) => a + b, 0) /
					latestTelemetryData.ph_levels.length
				).toFixed(2)
				: "—",
			unit: "pH",
			icon: <PiFlaskBold size={24} />,
			color: tokens.colors.purple[60],
		},
	];

	useEffect(() => {
		fetchTelemetryData()
	}, [])

	return (
		<Flex direction="column" gap={tokens.space.medium}>
			{/* Header Section with improved styling */}
			<Card borderRadius={tokens.radii.medium} padding={tokens.space.xxxs}>
				<Flex justifyContent="space-between" alignItems="center">
					<Flex direction="column" gap={tokens.space.xs}>
						<Heading level={2}>System Dashboard</Heading>
						<Text
							color={tokens.colors.neutral[60]}
							fontSize={tokens.fontSizes.small}
						>
							Real-time monitoring and sensor data
						</Text>
					</Flex>
					<Flex direction="column" alignItems="flex-end">
						<Badge variation="success">Live</Badge>
						<Text
							color={tokens.colors.neutral[60]}
							fontSize={tokens.fontSizes.small}
						>
							Updated: {new Date().toLocaleTimeString()}
						</Text>
					</Flex>
				</Flex>
			</Card>

			{/* Main Stats Grid */}
			<Grid
				templateColumns={{
					base: "1fr",
					medium: "1fr 1fr",
					large: "1fr 1fr 1fr 1fr",
				}}
				gap={tokens.space.medium}
			>
				{statsCards.map((card) => (
					<StatsCard
						key={card.title}
						title={card.title}
						value={card.value}
						unit={card.unit}
						icon={card.icon}
						color={card.color.value}
						trend="Real-time"
						trendUp={null}
					/>
				))}
			</Grid>
			{/* pH Levels Detail */}
			<Card padding={tokens.space.xxxs}>
				<Flex direction="column" gap={tokens.space.medium}>
					<Flex justifyContent="space-between" alignItems="center">
						<Flex alignItems="center" gap={tokens.space.xs}>
							<Heading level={3} fontWeight={tokens.fontWeights.light}>
								pH Readings
							</Heading>
						</Flex>
						<Badge variation="info">
							{latestTelemetryData?.ph_levels.length ?? 0} Active Sensors
						</Badge>
					</Flex>
					<Grid
						templateColumns={{
							base: "1fr",
							medium: "1fr 1fr 1fr",
						}}
						gap={tokens.space.medium}
					>
						{latestTelemetryData?.ph_levels.map((ph, index) => {
							const status = getPhStatus(ph);
							return (
								<Card
									key={`ph-${index}-${ph}`}
									backgroundColor={tokens.colors.background.secondary}
									borderRadius={tokens.radii.medium}
								>
									<Flex direction="column" gap={tokens.space.xs}>
										<Flex justifyContent="space-between" alignItems="center">
											<Text
												color={tokens.colors.neutral[60]}
												fontWeight={tokens.fontWeights.semibold}
											>
												Sensor {index + 1}
											</Text>
											<Badge
												backgroundColor={status.color}
												color={tokens.colors.white}
											>
												{status.label}
											</Badge>
										</Flex>
										<Heading
											level={1}
											color={tokens.colors.font.primary}
											fontSize={tokens.fontSizes.xxl}
										>
											{ph.toFixed(2)}
											<Text
												as="span"
												color={tokens.colors.neutral[60]}
												fontSize={tokens.fontSizes.small}
												marginLeft={tokens.space.xs}
											>
												pH
											</Text>
										</Heading>
									</Flex>
								</Card>
							);
						})}
					</Grid>
				</Flex>
			</Card>
			{/* Combined Chart Section */}
			<Card padding={tokens.space.xxxs}>
				<Flex
					direction="column"
					marginTop={tokens.space.medium}
					gap={tokens.space.medium}
				>
					<CombinedSensorChart
						temperatureData={temperatureHistory}
						phData={phHistory}
						humidityData={humidityHistory}
						lightData={lightHistory}
					/>
				</Flex>
			</Card>
		</Flex>
	);
}

function StatsCard({
	title,
	value,
	unit,
	trend,
	trendUp,
	icon,
	color,
}: {
	title: string;
	value: string;
	unit: string;
	trend: string;
	trendUp: boolean | null;
	icon: React.ReactNode;
	color: string;
}) {
	const { tokens } = useTheme();

	return (
		<Card
			backgroundColor={tokens.colors.background.secondary}
			borderRadius={tokens.radii.medium}
		>
			<Flex direction="column" gap={tokens.space.small}>
				<Flex alignItems="center" gap={tokens.space.xs}>
					<Text color={color}>{icon}</Text>
					<Text
						color={tokens.colors.neutral[60]}
						fontWeight={tokens.fontWeights.semibold}
					>
						{title}
					</Text>
				</Flex>
				<Heading
					level={1}
					margin={0}
					fontSize={tokens.fontSizes.xxxl}
					color={tokens.colors.font.primary}
				>
					{value}
					<Text
						as="span"
						color={tokens.colors.neutral[60]}
						fontSize={tokens.fontSizes.small}
						marginLeft={tokens.space.xs}
					>
						{unit}
					</Text>
				</Heading>
				<Text
					color={
						trendUp === null
							? tokens.colors.neutral[60]
							: trendUp
								? tokens.colors.green[60]
								: tokens.colors.red[60]
					}
					fontSize={tokens.fontSizes.small}
				>
					{trend}
				</Text>
			</Flex>
		</Card>
	);
}
