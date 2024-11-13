import { useCallback, useEffect, useState } from "react";
import { TOPICS } from "../constants/mqtt-topics";
import { usePubSubContext } from "../context/PubSubContext";

interface ShadowStateProperty {
	label: string;
	state: boolean;
}

interface TimestampMetadata {
	timestamp: number;
}

interface StateMetadata {
	label?: TimestampMetadata;
	state?: TimestampMetadata;
}

interface ShadowMetadata {
	desired: Record<string, TimestampMetadata>;
	reported: Record<string, TimestampMetadata>;
	delta?: Record<string, TimestampMetadata>;
}

interface BaseShadowDocument {
	state: {
		desired?: Record<string, ShadowStateProperty>;
		reported?: Record<string, ShadowStateProperty>;
		delta?: Record<string, ShadowStateProperty>;
	};
	metadata?: ShadowMetadata;
	version: number;
	timestamp: number;
	clientToken?: string;
}

export interface TGetAcceptedShadow extends BaseShadowDocument {
	metadata: ShadowMetadata;
	state: {
		desired: Record<string, ShadowStateProperty>;
		reported: Record<string, ShadowStateProperty>;
		delta?: Record<string, ShadowStateProperty>;
	};
}

export interface TUpdateAcceptedShadow extends BaseShadowDocument {
	metadata: ShadowMetadata;
	state: {
		desired: Record<string, ShadowStateProperty>;
	};
}

export interface TUpdateDocumentsShadow {
	previous: {
		state: {
			desired: Record<string, ShadowStateProperty>;
			reported: Record<string, ShadowStateProperty>;
		};
		metadata: ShadowMetadata;
		version: number;
	};
	current: {
		state: {
			desired: Record<string, ShadowStateProperty>;
			reported: Record<string, ShadowStateProperty>;
		};
		metadata: ShadowMetadata;
		version: number;
	};
	timestamp: number;
	clientToken?: string;
}

export type SubscriptionStatus = "pending" | "success" | "failed";
export type PublishStatus = "pending" | "success" | "failed";

export interface SubscriptionStates {
	getAccepted: SubscriptionStatus;
	getRejected: SubscriptionStatus;
	updateAccepted: SubscriptionStatus;
	updateDocuments: SubscriptionStatus;
	updateDelta: SubscriptionStatus;
	updateRejected: SubscriptionStatus;
	deleteRejected: SubscriptionStatus;
}

export interface PublishState {
	shadowGet: PublishStatus;
}

interface ShadowState {
	getAcceptedShadow?: TGetAcceptedShadow;
	getRejectedShadow?: string;
	updateAcceptedShadow?: TUpdateAcceptedShadow;
	updateDocumentsShadow?: TUpdateDocumentsShadow;
	responseStatus?: "accepted" | "rejected";
	subscriptionStates: SubscriptionStates;
	publishState: PublishState;
	retryCounts: Record<string, number>;
}

interface ShadowDeltaMessage {
	state: {
		delta?: Record<string, ShadowStateProperty>;
	};
	metadata?: {
		delta?: Record<string, StateMetadata>;
	};
	timestamp: number;
	version: number;
}

interface ShadowDocumentsMessage {
	previous: {
		state: {
			desired: Record<string, ShadowStateProperty>;
			reported: Record<string, ShadowStateProperty>;
		};
		metadata: ShadowMetadata;
		version: number;
	};
	current: {
		state: {
			desired: Record<string, ShadowStateProperty>;
			reported: Record<string, ShadowStateProperty>;
		};
		metadata: ShadowMetadata;
		version: number;
	};
	timestamp: number;
}

interface ShadowRejectedMessage {
	code: number;
	message: string;
	timestamp: number;
	clientToken?: string;
}

interface SyncStatus {
	isInSync: boolean;
	reason?: "latency" | "offline" | "conflict" | "override";
	details: string;
	outOfSyncRelays: Array<{
		name: string;
		desired: boolean;
		reported: boolean;
		desiredTimestamp: number;
		reportedTimestamp: number;
	}>;
	lastReportedUpdate: number;
	timeSinceLastSync: number;
}

export function useShadowState() {
	const pubSub = usePubSubContext();
	const [state, setState] = useState<ShadowState>({
		subscriptionStates: {
			getAccepted: "pending",
			getRejected: "pending",
			updateAccepted: "pending",
			updateDocuments: "pending",
			updateDelta: "pending",
			updateRejected: "pending",
			deleteRejected: "pending",
		},
		publishState: {
			shadowGet: "pending",
		},
		retryCounts: {},
	});

	// Update desired state only
	const setDesiredState = useCallback(
		async (relayName: string, newState: boolean, retries = 3) => {
			try {
				const message = {
					state: {
						desired: {
							[relayName]: {
								label: `Relay ${relayName.slice(-1)}`,
								state: newState,
							},
						},
					},
					clientToken: `${relayName}-${Date.now()}`, // For tracking specific updates
				};

				setState((prev) => ({
					...prev,
					publishState: { shadowGet: "pending" },
					getAcceptedShadow: prev.getAcceptedShadow
						? {
							...prev.getAcceptedShadow,
							state: {
								...prev.getAcceptedShadow.state,
								desired: {
									...prev.getAcceptedShadow.state.desired,
									[relayName]: message.state.desired[relayName],
								},
							},
						}
						: undefined,
				}));

				await pubSub.publish({
					topics: [TOPICS.shadow.update],
					message,
				});

				return true;
			} catch (error) {
				console.error(
					`Failed to update desired state for ${relayName}:`,
					error,
				);
				if (retries > 0) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
					return setDesiredState(relayName, newState, retries - 1);
				}
				setState((prev) => ({
					...prev,
					publishState: { shadowGet: "failed" },
				}));
				return false;
			}
		},
		[pubSub],
	);


	// Enhanced sync status checking
	const getStateSyncStatus = useCallback((): SyncStatus | null => {
		if (!state.getAcceptedShadow) return null;

		const { desired, reported } = state.getAcceptedShadow.state;
		const { metadata } = state.getAcceptedShadow;
		const now = Date.now();

		// Get last reported update timestamp
		const lastReportedUpdate = Math.max(
			...Object.values(metadata.reported)
				.filter((m) => m.timestamp !== undefined)
				.map((m) => m.timestamp || 0),
		);

		// Check if device is offline (no updates in last 30 seconds)
		const timeSinceLastSync = now - lastReportedUpdate;
		if (timeSinceLastSync > 30000) {
			return {
				isInSync: false,
				reason: "offline",
				details: "Device appears to be offline",
				outOfSyncRelays: Object.keys(desired)
					.filter((key) => key !== "welcome")
					.map((key) => ({
						name: key,
						desired: desired[key]?.state || false,
						reported: reported[key]?.state || false,
						desiredTimestamp: metadata.desired[key]?.timestamp || 0,
						reportedTimestamp: metadata.reported[key]?.timestamp || 0,
					})),
				lastReportedUpdate,
				timeSinceLastSync,
			};
		}

		// Find relays where desired and reported states don't match
		const outOfSyncRelays = Object.keys(desired)
			.filter((key) => key !== "welcome")
			.map((key) => ({
				name: key,
				desired: desired[key]?.state || false,
				reported: reported[key]?.state || false,
				desiredTimestamp: metadata.desired[key]?.timestamp || 0,
				reportedTimestamp: metadata.reported[key]?.timestamp || 0,
			}))
			.filter((relay) => relay.desired !== relay.reported);

		if (outOfSyncRelays.length > 0) {
			// Check for physical overrides
			const hasOverride = outOfSyncRelays.some(
				(relay) => relay.reportedTimestamp > relay.desiredTimestamp,
			);

			if (hasOverride) {
				return {
					isInSync: false,
					reason: "override",
					details: "Physical switch state differs from app control",
					outOfSyncRelays,
					lastReportedUpdate,
					timeSinceLastSync,
				};
			}

			// Check for latency issues
			const hasLatency = outOfSyncRelays.some(
				(relay) => now - relay.desiredTimestamp > 5000,
			);

			if (hasLatency) {
				return {
					isInSync: false,
					reason: "latency",
					details: "Device is taking longer than expected to sync",
					outOfSyncRelays,
					lastReportedUpdate,
					timeSinceLastSync,
				};
			}

			return {
				isInSync: false,
				reason: "conflict",
				details: "States are being synchronized",
				outOfSyncRelays,
				lastReportedUpdate,
				timeSinceLastSync,
			};
		}

		return {
			isInSync: true,
			details: "All relay states are synchronized",
			outOfSyncRelays: [],
			lastReportedUpdate,
			timeSinceLastSync,
		};
	}, [state.getAcceptedShadow]);

	// Monitor sync status changes
	useEffect(() => {
		const syncStatus = getStateSyncStatus();
		if (syncStatus && !syncStatus.isInSync) {
			console.log("Shadow sync status:", {
				reason: syncStatus.reason,
				details: syncStatus.details,
				outOfSyncRelays: syncStatus.outOfSyncRelays.map((relay) => ({
					name: relay.name,
					desired: relay.desired,
					reported: relay.reported,
					timeSinceDesired: Date.now() - relay.desiredTimestamp,
					timeSinceReported: Date.now() - relay.reportedTimestamp,
				})),
			});
		}
	}, [getStateSyncStatus]);

	// Enhanced update relay function
	const updateRelay = useCallback(
		async (relayName: string, newState: boolean) => {
			// Only update desired state
			const success = await setDesiredState(relayName, newState);

			if (!success) {
				setState((prev) => ({
					...prev,
					getRejectedShadow: `Failed to update ${relayName} to ${newState}`,
					responseStatus: "rejected",
				}));
			}

			return success;
		},
		[setDesiredState],
	);

	const handleDeltaUpdate = (deltaMessage: ShadowDeltaMessage) => {
		if (!deltaMessage.state?.delta) return;

		setState((prev) => {
			const currentDesiredState = {
				...prev.getAcceptedShadow?.state.desired,
				...deltaMessage.state.delta,
			};

			const currentMetadata: ShadowMetadata = {
				desired: prev.getAcceptedShadow?.metadata.desired || {},
				reported: prev.getAcceptedShadow?.metadata.reported || {},
				...(deltaMessage.metadata?.delta && {
					delta: Object.entries(deltaMessage.metadata.delta).reduce(
						(acc: Record<string, TimestampMetadata>, [key, value]) => {
							acc[key] = {
								timestamp: value.state?.timestamp || 0,
							};
							return acc;
						},
						{},
					),
				}),
			};

			return {
				...prev,
				getAcceptedShadow: prev.getAcceptedShadow
					? {
						...prev.getAcceptedShadow,
						state: {
							...prev.getAcceptedShadow.state,
							desired: currentDesiredState,
						},
						metadata: currentMetadata,
						version: deltaMessage.version,
						timestamp: deltaMessage.timestamp,
					}
					: undefined,
				updateDocumentsShadow: {
					previous: {
						state: {
							desired: prev.getAcceptedShadow?.state.desired || {},
							reported: prev.getAcceptedShadow?.state.reported || {},
						},
						metadata: {
							desired: {},
							reported: {},
						},
						version: (prev.getAcceptedShadow?.version || 0) - 1,
					},
					current: {
						state: {
							desired: currentDesiredState,
							reported: prev.getAcceptedShadow?.state.reported || {},
						},
						metadata: currentMetadata,
						version: deltaMessage.version,
					},
					timestamp: deltaMessage.timestamp,
				},
			};
		});
	};

	const handleDocumentsUpdate = (documentsMessage: ShadowDocumentsMessage) => {
		const { current, previous } = documentsMessage;
		setState((prev) => ({
			...prev,
			getAcceptedShadow: {
				state: current.state,
				metadata: current.metadata,
				version: current.version,
				timestamp: documentsMessage.timestamp,
			},
			updateDocumentsShadow: {
				previous,
				current,
				timestamp: documentsMessage.timestamp,
			},
			getRejectedShadow: undefined,
			responseStatus: "accepted",
		}));
	};

	const handleUpdateRejected = (message: ShadowRejectedMessage) => {
		setState((prev) => ({
			...prev,
			responseStatus: "rejected",
			getRejectedShadow: `Update failed: ${message.message} (Code: ${message.code})`,
			publishState: {
				...prev.publishState,
				shadowGet: "failed",
			},
		}));
	};

	const handleGetRejected = (message: ShadowRejectedMessage) => {
		setState((prev) => ({
			...prev,
			responseStatus: "rejected",
			getRejectedShadow: `Failed to fetch shadow: ${message.message} (Code: ${message.code})`,
			publishState: {
				...prev.publishState,
				shadowGet: "failed",
			},
		}));
	};

	const handleDeleteRejected = (message: ShadowRejectedMessage) => {
		setState((prev) => ({
			...prev,
			responseStatus: "rejected",
			getRejectedShadow: `Delete failed: ${message.message} (Code: ${message.code})`,
			publishState: {
				...prev.publishState,
				shadowGet: "failed",
			},
		}));
	};

	return {
		...state,
		updateRelay,
		handleDeltaUpdate,
		handleDocumentsUpdate,
		handleUpdateRejected,
		handleGetRejected,
		handleDeleteRejected,
		getStateSyncStatus,
		isDeviceOnline: useCallback(() => {
			const syncStatus = getStateSyncStatus();
			return syncStatus ? syncStatus.reason !== "offline" : false;
		}, [getStateSyncStatus]),
	};
}
