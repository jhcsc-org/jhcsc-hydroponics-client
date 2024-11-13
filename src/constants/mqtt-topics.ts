interface ShadowTopics {
	get: string;
	getAccepted: string;
	getRejected: string;
	update: string;
	updateDelta: string;
	updateAccepted: string;
	updateDocuments: string;
	updateRejected: string;
	delete: string;
	deleteAccepted: string;
	deleteRejected: string;
}

interface MqttTopics {
	shadow: ShadowTopics;
	telemetry: string;
	relay: string;
}

export const TOPICS: MqttTopics = {
	shadow: {
		get: "$aws/things/verdure/shadow/name/relays/get",
		getAccepted: "$aws/things/verdure/shadow/name/relays/get/accepted",
		getRejected: "$aws/things/verdure/shadow/name/relays/get/rejected",
		update: "$aws/things/verdure/shadow/name/relays/update",
		updateDelta: "$aws/things/verdure/shadow/name/relays/update/delta",
		updateAccepted: "$aws/things/verdure/shadow/name/relays/update/accepted",
		updateRejected: "$aws/things/verdure/shadow/name/relays/update/rejected",
		updateDocuments: "$aws/things/verdure/shadow/name/relays/update/documents",
		delete: "$aws/things/verdure/shadow/name/relays/delete",
		deleteAccepted: "$aws/things/verdure/shadow/name/relays/delete/accepted",
		deleteRejected: "$aws/things/verdure/shadow/name/relays/delete/rejected",
	},
	telemetry: "svene/iot/verdure/dashboard/telemetry",
	relay: "svene/iot/verdure/action/relay",
} as const;
