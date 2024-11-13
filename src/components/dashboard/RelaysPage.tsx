import {
	Alert,
	Badge,
	Button,
	Card,
	Collection,
	Flex,
	Grid,
	Heading,
	SwitchField,
	Text,
	View,
	useTheme,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import { TOPICS } from "../../constants/mqtt-topics";
import { usePubSubContext } from "../../context/PubSubContext";
import type {
	PublishState,
	SubscriptionStates,
	TGetAcceptedShadow,
	TUpdateAcceptedShadow,
	TUpdateDocumentsShadow,
} from "../../hooks/useShadowState";
import { RelayControlCard } from "./RelayControlCard";

const MAX_RETRIES = 3;

interface ShadowMessage {
	previous?: {
		state: {
			desired: Record<string, { label: string; state: boolean }>;
			reported: Record<string, { label: string; state: boolean }>;
		};
		metadata: {
			desired: Record<string, { timestamp: number }>;
			reported: Record<string, { timestamp: number }>;
		};
		version: number;
	};
	current?: {
		state: {
			desired: Record<string, { label: string; state: boolean }>;
			reported: Record<string, { label: string; state: boolean }>;
		};
		metadata: {
			desired: Record<string, { timestamp: number }>;
			reported: Record<string, { timestamp: number }>;
		};
		version: number;
	};
	state?: {
		desired: Record<string, { label: string; state: boolean }>;
		reported?: Record<string, { label: string; state: boolean }>;
		delta?: Record<string, { label: string; state: boolean }>;
	};
	version?: number;
	timestamp: number;
}

type SubscriptionHandler = (data: ShadowMessage) => void;

interface SyncStatus {
	isOutOfSync: boolean;
	reason?: "latency" | "offline" | "conflict" | "override" | "pending";
	details: string;
	timestamp?: number;
}

function getSyncStatus(shadow: TGetAcceptedShadow): SyncStatus {
	const { state, metadata, timestamp } = shadow;
	const now = Date.now();

	// Check if device is offline (no reported state updates in last 30 seconds)
	const lastReportedUpdate = Math.max(
		...Object.values(metadata.reported).map((m) => m.timestamp),
	);
	if (now - lastReportedUpdate > 30000) {
		return {
			isOutOfSync: true,
			reason: "offline",
			details:
				"Device appears to be offline - no updates received in the last 30 seconds",
			timestamp: lastReportedUpdate,
		};
	}

	// Filter out non-relay properties and only compare states and labels
	const desiredStates = Object.entries(state.desired)
		.filter(([key]) => key !== "welcome" && key.startsWith("relay"))
		.reduce(
			(acc, [key, value]) => {
				(acc as Record<string, { label: string; state: boolean }>)[key] = {
					label: value.label,
					state: value.state,
				};
				return acc;
			},
			{} as Record<string, { label: string; state: boolean }>,
		);

	const reportedStates = Object.entries(state.reported || {})
		.filter(([key]) => key !== "welcome" && key.startsWith("relay"))
		.reduce(
			(acc, [key, value]) => {
				(acc as Record<string, { label: string; state: boolean }>)[key] = {
					label: value.label,
					state: value.state,
				};
				return acc;
			},
			{} as Record<string, { label: string; state: boolean }>,
		);

	const statesMatch =
		JSON.stringify(desiredStates) === JSON.stringify(reportedStates);

	// Check for network latency (desired state not acknowledged within 5 seconds)
	const lastDesiredUpdate = Math.max(
		...Object.values(metadata.desired).map((m) => m.timestamp),
	);
	if (now - lastDesiredUpdate > 5000 && !statesMatch) {
		return {
			isOutOfSync: true,
			reason: "latency",
			details: "Changes pending - taking longer than usual to confirm",
			timestamp: lastDesiredUpdate,
		};
	}

	// Check for conflicts (multiple rapid changes)
	if (metadata.delta && Object.keys(metadata.delta).length > 0) {
		return {
			isOutOfSync: true,
			reason: "conflict",
			details: "Multiple changes detected - states are being synchronized",
			timestamp: timestamp,
		};
	}

	// Check for state differences
	if (!statesMatch) {
		return {
			isOutOfSync: true,
			reason: "conflict",
			details: "Device state is not synchronized with desired state",
			timestamp: timestamp,
		};
	}

	// Everything is in sync
	return {
		isOutOfSync: false,
		details: "All relay states and labels are synchronized",
		timestamp: timestamp,
	};
}

export function RelaysPage() {
	const pubSub = usePubSubContext();
	const { tokens } = useTheme();
	const [getAcceptedShadow, setGetAcceptedShadow] = useState<
		TGetAcceptedShadow | undefined
	>(undefined);
	const [getRejectedShadow, setGetRejectedShadow] = useState<
		string | undefined
	>(undefined);
	const [updateAcceptedShadow, setUpdateAcceptedShadow] = useState<
		TUpdateAcceptedShadow | undefined
	>(undefined);
	const [updateDocumentsShadow, setUpdateDocumentsShadow] = useState<
		TUpdateDocumentsShadow | undefined
	>(undefined);
	const [_, setResponseStatus] = useState<
		"accepted" | "rejected" | undefined
	>(undefined);
	const [subscriptionStates, setSubscriptionStates] =
		useState<SubscriptionStates>({
			getAccepted: "pending",
			getRejected: "pending",
			updateAccepted: "pending",
			updateDocuments: "pending",
			updateDelta: "pending",
			updateRejected: "pending",
			deleteRejected: "pending",
		});
	const [retryCounts, setRetryCounts] = useState<{ [key: string]: number }>({
		getAccepted: 0,
		getRejected: 0,
		shadowGet: 0,
		updateAccepted: 0,
		updateDocuments: 0,
	});
	const [publishState, setPublishState] = useState<PublishState>({
		shadowGet: "pending",
	});
	const [allRelaysOn, setAllRelaysOn] = useState(false);

	const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const hasReceivedResponseRef = useRef<boolean>(false);
	const isUnmountedRef = useRef<boolean>(false);
	const [refreshStateLoading, setRefreshStateLoading] = useState(false);
	const [toggleAllLoading, setToggleAllLoading] = useState(false);

	const handleRelayToggle = async (relay: string, newState: boolean) => {
		try {
			const message = {
				state: {
					desired: {
						[relay]: {
							...getAcceptedShadow?.state.desired[relay],
							state: newState,
						},
					},
				},
			};
			await pubSub.publish({
				topics: [TOPICS.shadow.update],
				message,
			});
		} catch (error) {
			console.error(`Failed to toggle ${relay}:`, error);
		}
	};

	const handleToggleAllRelays = async (newState: boolean) => {
		setToggleAllLoading(true);
		try {
			const desiredState = Object.keys(
				getAcceptedShadow?.state.desired || {},
			).reduce(
				(acc, relay) => {
					acc[relay] = {
						state: newState,
					};
					return acc;
				},
				{} as Record<string, { state: boolean }>,
			);

			for (const relay of Object.keys(desiredState)) {
				const message = {
					state: {
						desired: {
							[relay]: desiredState[relay],
						},
					},
				};

				await pubSub.publish({
					topics: [TOPICS.shadow.update],
					message,
				});

				// Introduce a delay between each relay toggle
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
		} catch (error) {
			console.error("Failed to toggle all relays:", error);
		} finally {
			setToggleAllLoading(false);
		}
	};

	const handleRelayRename = async (relay: string, newName: string) => {
		try {
			const shadowMessage = {
				state: {
					desired: {
						[relay]: {
							...getAcceptedShadow?.state.desired[relay],
							label: newName,
						},
					},
				},
			};
			await pubSub.publish({
				topics: [TOPICS.shadow.update],
				message: shadowMessage,
			});
			console.log("Relay renamed successfully:", relay, newName);
		} catch (error) {
			console.error(`Failed to rename ${relay}:`, error);
			throw error;
		}
	};

	useEffect(() => {
		isUnmountedRef.current = false;

		const subscribeWithRetry = async (
			topic: string,
			handler: SubscriptionHandler,
			topicKey: keyof SubscriptionStates,
		): Promise<void> => {
			for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
				try {
					pubSub.subscribe({ topics: [topic] }).subscribe({
						next: (data) => {
							handler(data as unknown as ShadowMessage);
						},
						error: (err) => {
							throw err;
						},
					});

					setSubscriptionStates((prev) => ({
						...prev,
						[topicKey]: "success",
					}));
					console.log(
						`Successfully subscribed to ${topic} on attempt ${attempt}`,
					);
					break;
				} catch (error) {
					console.error(
						`Attempt ${attempt} to subscribe to ${topic} failed:`,
						error,
					);

					setRetryCounts((prev) => ({
						...prev,
						[topicKey]: attempt,
					}));

					if (attempt === MAX_RETRIES) {
						setSubscriptionStates((prev) => ({
							...prev,
							[topicKey]: "failed",
						}));
					} else {
						const currentDelay = 1000;
						await new Promise((resolve) => setTimeout(resolve, currentDelay));
					}
				}
			}
		};

		const setupSubscriptions = async () => {
			subscribeWithRetry(
				TOPICS.shadow.getAccepted,
				(data) => {
					console.log("Accepted data received:", data);
					setResponseStatus("accepted");
					setGetAcceptedShadow(data as TGetAcceptedShadow);
					hasReceivedResponseRef.current = true;

					if (responseTimeoutRef.current) {
						clearTimeout(responseTimeoutRef.current);
						responseTimeoutRef.current = null;
					}
				},
				"getAccepted",
			);

			subscribeWithRetry(
				TOPICS.shadow.getRejected,
				(data) => {
					console.log("Rejected data received:", data);
					setResponseStatus("rejected");
					setGetRejectedShadow(data as unknown as string);
					hasReceivedResponseRef.current = true;

					if (responseTimeoutRef.current) {
						clearTimeout(responseTimeoutRef.current);
						responseTimeoutRef.current = null;
					}
				},
				"getRejected",
			);

			subscribeWithRetry(
				TOPICS.shadow.updateAccepted,
				(data) => {
					console.log("Shadow update accepted received:", data);
					setUpdateAcceptedShadow(data as TUpdateAcceptedShadow);
				},
				"updateAccepted",
			);

			subscribeWithRetry(
				TOPICS.shadow.updateDocuments,
				(data: ShadowMessage) => {
					console.log("Shadow documents update received:", data);
					if (data.previous && data.current) {
						setUpdateDocumentsShadow({
							previous: data.previous,
							current: data.current,
							timestamp: data.timestamp,
						});

						if (data.current.state) {
							setGetAcceptedShadow({
								state: data.current.state,
								metadata: data.current.metadata,
								version: data.current.version,
								timestamp: data.timestamp,
							});
						}
					}
				},
				"updateDocuments",
			);

			subscribeWithRetry(
				TOPICS.shadow.updateDelta,
				(data: ShadowMessage) => {
					console.log("Shadow delta received:", data);
					if (data.state?.delta && Object.keys(data.state.delta).length > 0) {
						setGetAcceptedShadow((prev) => {
							if (!prev) return prev;
							return {
								...prev,
								state: {
									...prev.state,
									desired: {
										...prev.state.desired,
										...data.state?.delta,
									},
								},
							};
						});
					}
				},
				"updateDelta",
			);
		};

		setupSubscriptions();

		return () => {
			isUnmountedRef.current = true;
			if (responseTimeoutRef.current) {
				clearTimeout(responseTimeoutRef.current);
			}
		};
	}, [pubSub]);

	useEffect(() => {
		const publishWithRetry = async () => {
			for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
				try {
					await pubSub.publish({
						topics: [TOPICS.shadow.get],
						message: {},
					});
					setPublishState({ shadowGet: "success" });
					console.log(
						`Successfully published to shadow/get on attempt ${attempt}`,
					);

					const timeoutDuration = 100;
					responseTimeoutRef.current = setTimeout(() => {
						if (!hasReceivedResponseRef.current && !isUnmountedRef.current) {
							console.warn(
								"No response received for shadow/get, retrying publish...",
							);
							setPublishState({ shadowGet: "pending" });
							publishWithRetry();
						}
					}, timeoutDuration);

					break;
				} catch (error) {
					console.error(
						`Attempt ${attempt} to publish to shadow/get failed:`,
						error,
					);

					setRetryCounts((prev) => ({
						...prev,
						shadowGet: attempt,
					}));

					if (attempt === MAX_RETRIES) {
						setPublishState({ shadowGet: "failed" });
					} else {
						const currentDelay = 1000;
						await new Promise((resolve) => setTimeout(resolve, currentDelay));
					}
				}
			}
		};

		const allSubscriptionsSuccessful =
			subscriptionStates.getAccepted === "success" &&
			subscriptionStates.getRejected === "success" &&
			subscriptionStates.updateAccepted === "success" &&
			subscriptionStates.updateDocuments === "success";

		if (allSubscriptionsSuccessful && publishState.shadowGet === "pending") {
			const initiatePublish = async () => {
				await new Promise((resolve) => setTimeout(resolve, 500));
				publishWithRetry();
			};

			initiatePublish();
		}
	}, [subscriptionStates, pubSub, publishState.shadowGet]);

	useEffect(() => {
		if (getAcceptedShadow?.state.desired) {
			const relayStates = Object.entries(getAcceptedShadow.state.desired)
				.filter(([key]) => key.startsWith("relay"))
				.map(([_, value]) => value.state);

			// Only set to true if ALL relays are on
			setAllRelaysOn(
				relayStates.length > 0 && relayStates.every((state) => state === true),
			);
		}
	}, [getAcceptedShadow]);

	const subscriptionItems = [
		{
			label: "Shadow Get Accepted",
			status: subscriptionStates.getAccepted,
			retries: retryCounts.getAccepted,
			details: "Subscription to shadow get accepted topic",
			topic: TOPICS.shadow.getAccepted,
		},
		{
			label: "Shadow Get Rejected",
			status: subscriptionStates.getRejected,
			retries: retryCounts.getRejected,
			details: "Subscription to shadow get rejected topic",
			topic: TOPICS.shadow.getRejected,
		},
		{
			label: "Shadow Update Accepted",
			status: subscriptionStates.updateAccepted,
			retries: retryCounts.updateAccepted,
			details: "Subscription to shadow update accepted topic",
			topic: TOPICS.shadow.updateAccepted,
		},
		{
			label: "Shadow Update Documents",
			status: subscriptionStates.updateDocuments,
			retries: retryCounts.updateDocuments,
			details: "Subscription to shadow update documents topic",
			topic: TOPICS.shadow.updateDocuments,
		},
		{
			label: "Shadow Get Publish",
			status: publishState.shadowGet,
			retries: retryCounts.shadowGet,
			details: "Publishing to shadow get topic",
			topic: TOPICS.shadow.get,
		},
	];

	const renderShadowUpdates = () => {
		if (!updateAcceptedShadow && !updateDocumentsShadow) return null;

		return (
			<View>
				{updateAcceptedShadow && (
					<Alert
						variation="info"
						marginBottom={tokens.space.small}
						backgroundColor={tokens.colors.background.info}
						color={tokens.colors.font.primary}
						padding={tokens.space.medium}
						isDismissible={false}
						hasIcon={false}
					>
						<Flex direction="column" gap={tokens.space.xs}>
							<Text fontWeight="bold" fontSize={tokens.fontSizes.medium}>
								Version {updateAcceptedShadow.version}
							</Text>
							<Text
								fontSize={tokens.fontSizes.small}
								color={tokens.colors.font.tertiary}
							>
								{new Date(
									updateAcceptedShadow.timestamp * 1000,
								).toLocaleString()}
							</Text>
							<Text
								fontSize={tokens.fontSizes.small}
								color={tokens.colors.font.secondary}
							>
								Details: The shadow update was accepted and the device state has
								been updated to the desired state.
							</Text>
						</Flex>
					</Alert>
				)}

				{updateDocumentsShadow && (
					<Alert
						variation="warning"
						backgroundColor={tokens.colors.background.warning}
						color={tokens.colors.font.warning}
						padding={tokens.space.medium}
						isDismissible={false}
						hasIcon={false}
						marginBottom={tokens.space.medium}
					>
						<Flex direction="column" gap={tokens.space.xs}>
							<Text fontWeight="bold" fontSize={tokens.fontSizes.medium}>
								Pending Changes in Delta
							</Text>
							<Text
								fontSize={tokens.fontSizes.small}
								color={tokens.colors.font.secondary}
							>
								{Object.keys(updateDocumentsShadow.current.state.desired).some(
									(key) =>
										key.startsWith("relay") &&
										updateDocumentsShadow.current.state.desired[key].state !==
										updateDocumentsShadow.current.state.reported?.[key]
											?.state,
								)
									? "The desired state does not match the reported state for some relays."
									: "No pending changes detected."}
							</Text>
							<Text
								fontSize={tokens.fontSizes.small}
								color={tokens.colors.font.tertiary}
							>
								Version: {updateDocumentsShadow.current.version}
							</Text>
							<Text
								fontSize={tokens.fontSizes.small}
								color={tokens.colors.font.secondary}
							>
								Details: The shadow document has been updated. Please review the
								changes to ensure the device state is synchronized.
							</Text>
						</Flex>
					</Alert>
				)}
			</View>
		);
	};

	const renderSyncStatus = () => {
		if (!getAcceptedShadow) return null;

		const status = getSyncStatus(getAcceptedShadow);

		return (
			<Flex direction="row" gap="small">
				<Badge variation={status.isOutOfSync ? "warning" : "success"}>
					<div
						style={{
							marginRight: "4px",
						}}
					>
						{status.isOutOfSync ? <FiAlertCircle /> : <FiCheckCircle />}
					</div>
					{status.isOutOfSync ? " Out of Sync" : " In Sync"}
				</Badge>
			</Flex>
		);
	};

	const renderHeader = () => (
		<Flex direction="column" gap={tokens.space.xs}>
			<Flex justifyContent="space-between" alignItems="center">
				<Heading level={2}>Relay Management</Heading>
				<Flex gap={tokens.space.xs} alignItems="center">
					{renderSyncStatus()}
					<Badge
						variation={
							publishState.shadowGet === "success" ? "success" : "warning"
						}
					>
						{publishState.shadowGet === "success"
							? "Connected"
							: "Connecting..."}
					</Badge>
				</Flex>
			</Flex>
			<Text color={tokens.colors.font.tertiary}>
				Control and monitor device relays
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

			{/* Error States */}
			{getRejectedShadow && (
				<Alert variation="error" isDismissible heading="Shadow Update Rejected">
					<Flex direction="column" gap={tokens.space.small}>
						<Text>{getRejectedShadow}</Text>
						<Button
							size="small"
							variation="link"
							isLoading={toggleAllLoading}
							onClick={() => {
								setGetRejectedShadow(undefined);
								pubSub.publish({
									topics: [TOPICS.shadow.get],
									message: {},
								});
							}}
						>
							<Flex gap={tokens.space.xs} alignItems="center">
								<FiRefreshCw />
								<Text>Retry</Text>
							</Flex>
						</Button>
					</Flex>
				</Alert>
			)}

			{/* Main Grid Layout */}
			<Grid
				templateColumns={{ base: "1fr", large: "3fr 1fr" }}
				gap={tokens.space.large}
			>
				{/* Relay Controls Section */}
				<Card padding={tokens.space.xxs}>
					<Flex
						justifyContent="space-between"
						alignItems="center"
						marginBottom={tokens.space.large}
					>
						<Heading level={4}>Relay Controls</Heading>
						<Flex gap={tokens.space.xxxs}>
							<Button
								size="small"
								variation="link"
								isLoading={refreshStateLoading}
								onClick={async () => {
									setRefreshStateLoading(true);
									try {
										await pubSub.publish({
											topics: [TOPICS.shadow.get],
											message: {},
										});
										await new Promise((resolve) => setTimeout(resolve, 300));
									} catch (error) {
										console.error("Failed to refresh state:", error);
									} finally {
										setRefreshStateLoading(false);
									}
								}}
							>
								<Flex gap={tokens.space.xs} alignItems="center">
									<FiRefreshCw />
									<Text>Refresh</Text>
								</Flex>
							</Button>
							<SwitchField
								label={toggleAllLoading ? "Toggling All Relays..." : "All Relays"}
								fontSize={tokens.fontSizes.small}
								fontWeight="bold"
								isChecked={allRelaysOn}
								isDisabled={refreshStateLoading || toggleAllLoading}
								onChange={async (e) => {
									const newState = e.target.checked;
									setAllRelaysOn(newState);
									await handleToggleAllRelays(newState);
								}}
								labelPosition="start"
							/>
						</Flex>
					</Flex>
					<Collection
						type="grid"
						items={Object.keys(getAcceptedShadow?.state.desired || {}).filter(
							(key) => key.startsWith("relay") && key !== "welcome",
						)}
						templateColumns={{
							base: "1fr",
							medium: "1fr 1fr",
							large: "1fr 1fr",
						}}
						gap={tokens.space.medium}
					>
						{(relay) => (
							<RelayControlCard
								key={relay}
								relayName={relay}
								initialState={getAcceptedShadow!.state.desired[relay]}
								onToggle={(newState) => handleRelayToggle(relay, newState)}
								onRename={(newName) => handleRelayRename(relay, newName)}
							/>
						)}
					</Collection>
				</Card>

				{/* Status Section */}
				<Flex direction="column" gap={tokens.space.medium}>
					{/* Connection Status */}
					<Card padding={tokens.space.medium}>
						<Heading level={4} marginBottom={tokens.space.medium}>
							Connection Status
						</Heading>
						<Grid templateColumns="1fr" gap={tokens.space.xs}>
							{subscriptionItems.map((item) => (
								<Alert
									variation={item.status === "success" ? "success" : "warning"}
									key={item.label}
									isDismissible={false}
									hasIcon={true}
								>
									<Flex
										justifyContent="space-between"
										alignItems="center"
										gap={tokens.space.xs}
									>
										<Text fontSize={tokens.fontSizes.small}>{item.label}</Text>
										{item.retries > 0 && item.status !== "success" && (
											<Badge variation="warning">Retries: {item.retries}</Badge>
										)}
									</Flex>
								</Alert>
							))}
						</Grid>
					</Card>

					{/* Recent Updates */}
					{(updateAcceptedShadow || updateDocumentsShadow) && (
						<Card padding={tokens.space.medium}>
							<Heading level={4} marginBottom={tokens.space.medium}>
								Recent Updates
							</Heading>
							{renderShadowUpdates()}
						</Card>
					)}
				</Flex>
			</Grid>
		</Flex>
	);
}
