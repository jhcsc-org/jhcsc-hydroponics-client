import { usePubSubContext } from "../context/PubSubContext";

type PublishContent = Record<string | symbol, unknown>;

interface PublishOptions {
	[key: string]: unknown;
	// biome-ignore lint/suspicious/noExplicitAny: we need to support any provider
	provider?: string | symbol | any;
}

// Original overrides for returning a no-argument publish function
export function usePublish<T extends PublishContent>(
	topic: string,
	message: T,
	options?: PublishOptions,
): () => void;
export function usePublish<T extends PublishContent>(
	topics: string[],
	message: T,
	options?: PublishOptions,
): () => void;

// New overrides for returning a function that accepts a message
export function usePublish<T extends PublishContent>(
	topic: string,
	defaultMessage?: T,
	options?: PublishOptions,
): (message?: T) => void;
export function usePublish<T extends PublishContent>(
	topics: string[],
	defaultMessage?: T,
	options?: PublishOptions,
): (message?: T) => void;

export function usePublish<T extends PublishContent>(
	topicOrTopics: string | string[],
	defaultMessage?: T,
	options?: PublishOptions,
) {
	const pubsub = usePubSubContext();
	return (message?: T) => {
		const topics = Array.isArray(topicOrTopics)
			? topicOrTopics
			: [topicOrTopics];
		pubsub.publish({
			topics,
			message: message ?? defaultMessage ?? {},
			options,
		});
	};
}
