import { PubSub } from "@aws-amplify/pubsub";

export interface PubSubConfig {
	region: string;
	endpoint: string;
}

let pubsubInstance: PubSub | null = null;

export const getPubSub = (config: PubSubConfig) => {
	if (!pubsubInstance) {
		pubsubInstance = new PubSub({
			region: config.region,
			endpoint: config.endpoint,
		});
	}
	return pubsubInstance;
};
