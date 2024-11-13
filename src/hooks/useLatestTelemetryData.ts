import { useEffect, useState } from "react";
import type { TTelemetryMessage } from "../types/telemetry";
import { useSubscribe } from "./useSubscribe";

const CACHE_KEY = "latest_telemetry";
const CACHE_EXPIRY = 1000 * 60 * 5; // 5 minutes

interface CachedData {
	data: TTelemetryMessage;
	timestamp: number;
}

export function useLatestTelemetryData(topic: string) {
	const { message } = useSubscribe<TTelemetryMessage>(topic);
	const [latestData, setLatestData] = useState<TTelemetryMessage | null>(() => {
		try {
			const cached = localStorage.getItem(CACHE_KEY);
			if (!cached) return null;

			const { data, timestamp }: CachedData = JSON.parse(cached);
			const now = Date.now();

			// Return null if cache is expired
			if (now - timestamp > CACHE_EXPIRY) {
				localStorage.removeItem(CACHE_KEY);
				return null;
			}

			return data;
		} catch {
			return null;
		}
	});

	// Update latest data and cache when new message arrives
	useEffect(() => {
		if (!message) return;

		if (JSON.stringify(message) !== JSON.stringify(latestData)) {
			setLatestData(message);

			// Cache the new data
			try {
				const cacheData: CachedData = {
					data: message,
					timestamp: Date.now(),
				};
				localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
			} catch (error) {
				console.warn("Error caching telemetry data:", error);
			}
		}
	}, [message, latestData]);

	// Periodically check and clean expired cache
	useEffect(() => {
		const cleanup = () => {
			try {
				const cached = localStorage.getItem(CACHE_KEY);
				if (!cached) return;

				const { timestamp }: CachedData = JSON.parse(cached);
				if (Date.now() - timestamp > CACHE_EXPIRY) {
					localStorage.removeItem(CACHE_KEY);
					setLatestData(null);
				}
			} catch (error) {
				console.warn("Error cleaning cache:", error);
			}
		};

		const interval = setInterval(cleanup, CACHE_EXPIRY);
		return () => clearInterval(interval);
	}, []);

	return latestData;
}
