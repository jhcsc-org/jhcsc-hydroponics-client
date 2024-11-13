import type { PubSub } from "@aws-amplify/pubsub";
import type React from "react";
import { createContext, useContext, useMemo } from "react";
import { type PubSubConfig, getPubSub } from "../utils/pubsub";

const PubSubContext = createContext<PubSub | null>(null);

interface PubSubProviderProps {
	config: PubSubConfig;
	children: React.ReactNode;
}

export const PubSubProvider: React.FC<PubSubProviderProps> = ({
	config,
	children,
}) => {
	const pubsub = useMemo(() => getPubSub(config), [config]);
	return (
		<PubSubContext.Provider value={pubsub}>{children}</PubSubContext.Provider>
	);
};

export const usePubSubContext = () => {
	const context = useContext(PubSubContext);
	if (!context) {
		throw new Error("usePubSubContext must be used within a PubSubProvider");
	}
	return context;
};
