import {
	Alert,
	Button,
	Card,
	Divider,
	Flex,
	Grid,
	Heading,
	SelectField,
	Text,
	TextField,
	useTheme,
} from "@aws-amplify/ui-react";
import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiRefreshCw, FiRotateCcw } from "react-icons/fi";
import { TOPICS } from "../../constants/mqtt-topics";
import { usePubSubContext } from "../../context/PubSubContext";
import { useSettings } from "../../context/SettingsContext";

export function SettingsPage() {
	const { tokens } = useTheme();
	const pubSub = usePubSubContext();
	const { settings, updateSettings, resetToDefaults } = useSettings();

	const [isEditing, setIsEditing] = useState(false);
	const [tempSettings, setTempSettings] = useState(settings);
	const [syncStatus, setSyncStatus] = useState<{
		status: "synced" | "syncing" | "error" | "offline";
		lastSyncTime?: number;
		error?: string;
	}>({ status: "syncing" });
	const [isOnline, setIsOnline] = useState(true);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	useEffect(() => {
		if (isOnline) {
			refreshShadowState();
		} else {
			setSyncStatus({ status: "offline" });
		}
	}, [isOnline]);

	const refreshShadowState = useCallback(async () => {
		setSyncStatus({ status: "syncing" });
		try {
			await pubSub.publish({ topics: [TOPICS.shadow.get], message: {} });
			setSyncStatus({ status: "synced", lastSyncTime: Date.now() });
		} catch (error) {
			setSyncStatus({
				status: "error",
				error: "Failed to sync with device shadow",
			});
		}
	}, [pubSub]);

	const handleSave = async () => {
		const { tooAcidic, slightlyAcidic, optimal, slightlyAlkaline, tooAlkaline } =
			tempSettings.phThresholds;

		if (
			tooAcidic > slightlyAcidic ||
			slightlyAcidic > optimal ||
			optimal > slightlyAlkaline ||
			slightlyAlkaline > tooAlkaline
		) {
			setSyncStatus({
				status: "error",
				error: "pH thresholds must be in ascending order",
			});
			return;
		}

		setSyncStatus({ status: "syncing" });
		try {
			await updateSettings(tempSettings);
			setSyncStatus({ status: "synced", lastSyncTime: Date.now() });
			setIsEditing(false);
		} catch (error) {
			setSyncStatus({ status: "error", error: "Failed to save settings" });
		}
	};

	const handleResetToDefaults = async () => {
		if (
			!window.confirm(
				"Are you sure you want to reset all settings to factory defaults? This action cannot be undone."
			)
		) {
			return;
		}

		setSyncStatus({ status: "syncing" });
		try {
			await resetToDefaults();
			setTempSettings(settings);
			setSyncStatus({ status: "synced", lastSyncTime: Date.now() });
			setIsEditing(false);
		} catch (error) {
			setSyncStatus({ status: "error", error: "Failed to reset settings" });
		}
	};

	const renderSyncStatus = () => {
		switch (syncStatus.status) {
			case "synced":
				return (
					<Alert variation="success" isDismissible={false}>
						<Flex gap={tokens.space.xs} alignItems="center">
							<Text>
								Settings synchronized at{" "}
								{syncStatus.lastSyncTime &&
									new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
							</Text>
						</Flex>
					</Alert>
				);
			case "syncing":
				return (
					<Alert variation="info" isDismissible={false}>
						<Flex gap={tokens.space.xs} alignItems="center">
							<FiRefreshCw className="spin" />
							<Text>Synchronizing settings...</Text>
						</Flex>
					</Alert>
				);
			case "error":
				return (
					<Alert variation="error" isDismissible={false}>
						<Flex gap={tokens.space.xs} alignItems="center">
							<FiAlertCircle />
							<Text>{syncStatus.error || "Error synchronizing settings"}</Text>
							<Button
								variation="link"
								onClick={refreshShadowState}
								marginLeft="auto"
							>
								Retry
							</Button>
						</Flex>
					</Alert>
				);
			case "offline":
				return (
					<Alert variation="warning" isDismissible={false}>
						<Flex gap={tokens.space.xs} alignItems="center">
							<FiAlertCircle />
							<Text>
								You are offline. Changes will be synchronized when you
								reconnect.
							</Text>
						</Flex>
					</Alert>
				);
		}
	};

	return (
		<Flex direction="column" gap={tokens.space.medium} padding={tokens.space.xxxs}>
			<Card borderRadius={tokens.radii.medium} padding={tokens.space.xxxs}>
				<Flex direction="column" gap={tokens.space.medium}>
					<Flex justifyContent="space-between" alignItems="center">
						<Flex direction="column" gap={tokens.space.xs}>
							<Heading level={2}>Settings</Heading>
							<Text
								color={tokens.colors.neutral[60]}
								fontSize={tokens.fontSizes.small}
							>
								Configure system settings
							</Text>
						</Flex>
						<Flex gap={tokens.space.xs}>
							<Button
								variation="link"
								onClick={refreshShadowState}
								isDisabled={!isOnline || syncStatus.status === "syncing"}
							>
								<Flex gap={tokens.space.xs} alignItems="center">
									<FiRefreshCw />
									<Text>Refresh</Text>
								</Flex>
							</Button>
							{isEditing ? (
								<>
									<Button
										variation="link"
										onClick={() => {
											setTempSettings(settings);
											setIsEditing(false);
										}}
									>
										Cancel
									</Button>
									<Button
										variation="primary"
										onClick={handleSave}
										isDisabled={!isOnline}
									>
										Save Changes
									</Button>
								</>
							) : (
								<Button
									variation="primary"
									onClick={() => setIsEditing(true)}
									isDisabled={!isOnline}
								>
									Edit Settings
								</Button>
							)}
						</Flex>
					</Flex>
					{renderSyncStatus()}
				</Flex>
			</Card>

			<Card borderRadius={tokens.radii.medium} padding={tokens.space.medium}>
				<Flex direction="column" gap={tokens.space.medium}>
					<Heading level={4}>Factory Reset</Heading>
					<Text color={tokens.colors.font.secondary}>
						Reset all settings to their factory-calibrated values
					</Text>
					<Alert variation="warning" isDismissible={false}>
						<Text>
							This will restore all pH thresholds, sensor calibrations, and unit
							preferences to their original factory settings. This action cannot
							be undone.
						</Text>
					</Alert>
					<Button
						variation="warning"
						onClick={handleResetToDefaults}
						isDisabled={!isOnline}
					>
						<Flex gap={tokens.space.xs} alignItems="center">
							<FiRotateCcw />
							<Text>Reset to Factory Defaults</Text>
						</Flex>
					</Button>
				</Flex>
			</Card>

			<Grid
				templateColumns={{ base: "1fr", large: "1fr 1fr" }}
				gap={tokens.space.medium}
			>
				<Card borderRadius={tokens.radii.medium} padding={tokens.space.medium}>
					<Heading level={4} marginBottom={tokens.space.medium}>
						pH Thresholds
					</Heading>
					<Flex direction="column" gap={tokens.space.small}>
						{Object.entries(tempSettings.phThresholds).map(([key, value]) => (
							<TextField
								key={key}
								label={key.replace(/([A-Z])/g, " $1").toLowerCase()}
								type="number"
								step="0.1"
								value={value}
								isDisabled={!isEditing}
								onChange={(e) =>
									setTempSettings((prev) => ({
										...prev,
										phThresholds: {
											...prev.phThresholds,
											[key]: parseFloat(e.target.value),
										},
									}))
								}
							/>
						))}
					</Flex>
				</Card>

				<Card borderRadius={tokens.radii.medium} padding={tokens.space.medium}>
					<Heading level={4} marginBottom={tokens.space.medium}>
						pH Sensor Calibration
					</Heading>
					{Object.entries(tempSettings.phSensorCalibration).map(([sensorId, calibration]) => (
						<Flex key={sensorId} direction="column" gap={tokens.space.xs}>
							<Text fontWeight="bold">Sensor {sensorId.replace("sensor", "")}</Text>
							<Grid templateColumns="1fr 1fr" gap={tokens.space.xs}>
								<TextField
									label="Offset"
									type="number"
									step="0.01"
									value={calibration.offset}
									isDisabled={!isEditing}
									onChange={(e) =>
										setTempSettings((prev) => ({
											...prev,
											phSensorCalibration: {
												...prev.phSensorCalibration,
												[sensorId]: {
													...prev.phSensorCalibration[sensorId],
													offset: parseFloat(e.target.value),
												},
											},
										}))
									}
								/>
								<TextField
									label="Slope"
									type="number"
									step="0.01"
									value={calibration.slope}
									isDisabled={!isEditing}
									onChange={(e) =>
										setTempSettings((prev) => ({
											...prev,
											phSensorCalibration: {
												...prev.phSensorCalibration,
												[sensorId]: {
													...prev.phSensorCalibration[sensorId],
													slope: parseFloat(e.target.value),
												},
											},
										}))
									}
								/>
							</Grid>
							<Divider marginBlock={tokens.space.xs} />
						</Flex>
					))}
				</Card>

				<Card borderRadius={tokens.radii.medium} padding={tokens.space.medium}>
					<Heading level={4} marginBottom={tokens.space.medium}>
						Units Configuration
					</Heading>
					<Flex direction="column" gap={tokens.space.small}>
						<SelectField
							label="Temperature Unit"
							value={tempSettings.temperatureUnit}
							isDisabled={!isEditing}
							onChange={(e) =>
								setTempSettings((prev) => ({
									...prev,
									temperatureUnit: e.target.value as "celsius" | "fahrenheit",
								}))
							}
						>
							<option value="celsius">Celsius (°C)</option>
							<option value="fahrenheit">Fahrenheit (°F)</option>
						</SelectField>

						<SelectField
							label="Light Unit"
							value={tempSettings.lightUnit}
							isDisabled={!isEditing}
							onChange={(e) =>
								setTempSettings((prev) => ({
									...prev,
									lightUnit: e.target.value as "lux" | "percentage",
								}))
							}
						>
							<option value="lux">Lux</option>
							<option value="percentage">Percentage (%)</option>
						</SelectField>
					</Flex>
				</Card>
			</Grid>
		</Flex>
	);
}
