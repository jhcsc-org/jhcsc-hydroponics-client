import { useEffect, useState } from "react";
import type { TTelemetryMessage } from "../types/telemetry";
import { useSubscribe } from "./useSubscribe";

const CACHE_KEY_LATEST = "telemetry_latest";
const CACHE_KEY_HISTORY = "telemetry_history";
const HISTORY_LIMIT = 50;
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

interface CachedData<T> {
	data: T;
	timestamp: number;
}

interface TelemetryHistory {
	temperature: number[];
	humidity: number[];
	light_level: number[];
	ph_levels: number[][];
}

function loadFromCache<T>(key: string): T | null {
	try {
		const cached = localStorage.getItem(key);
		if (!cached) return null;

		const { data, timestamp }: CachedData<T> = JSON.parse(cached);
		const now = Date.now();

		// Return null if cache is expired
		if (now - timestamp > CACHE_EXPIRY) {
			localStorage.removeItem(key);
			return null;
		}

		return data;
	} catch (error) {
		console.warn("Error loading from cache:", error);
		return null;
	}
}

function saveToCache<T>(key: string, data: T) {
	try {
		const cacheData: CachedData<T> = {
			data,
			timestamp: Date.now(),
		};
		localStorage.setItem(key, JSON.stringify(cacheData));
	} catch (error) {
		console.warn("Error saving to cache:", error);
	}
}

export function useCachedTelemetryData(topic: string) {
	const { message } = useSubscribe<TTelemetryMessage>(topic);
	const [latestData, setLatestData] = useState<TTelemetryMessage | null>(() =>
		loadFromCache<TTelemetryMessage>(CACHE_KEY_LATEST),
	);
	const [history, setHistory] = useState<TelemetryHistory>(
		() =>
			loadFromCache<TelemetryHistory>(CACHE_KEY_HISTORY) || {
				temperature: [],
				humidity: [],
				light_level: [],
				ph_levels: [[], [], [], []],
			},
	);

	// Update latest data and cache when new message arrives
	useEffect(() => {
		if (!message) return;

		setLatestData(message);
		saveToCache(CACHE_KEY_LATEST, message);

		setHistory((prev) => {
			const newHistory = {
				temperature: [...prev.temperature, message.temperature].slice(
					-HISTORY_LIMIT,
				),
				humidity: [...prev.humidity, message.humidity].slice(-HISTORY_LIMIT),
				light_level: [...prev.light_level, message.light_level].slice(
					-HISTORY_LIMIT,
				),
				ph_levels: message.ph_levels.map((ph, i) =>
					[...(prev.ph_levels[i] || []), ph].slice(-HISTORY_LIMIT),
				),
			};
			saveToCache(CACHE_KEY_HISTORY, newHistory);
			return newHistory;
		});
	}, [message]);

	// Periodically clean expired cache
	useEffect(() => {
		const cleanup = () => {
			const latest = loadFromCache<TTelemetryMessage>(CACHE_KEY_LATEST);
			const historical = loadFromCache<TelemetryHistory>(CACHE_KEY_HISTORY);

			if (!latest) setLatestData(null);
			if (!historical) {
				setHistory({
					temperature: [],
					humidity: [],
					light_level: [],
					ph_levels: [[], [], [], []],
				});
			}
		};

		const interval = setInterval(cleanup, CACHE_EXPIRY);
		return () => clearInterval(interval);
	}, []);

	return {
		latest: latestData,
		history,
		isLoading: !latestData,
		lastUpdated: latestData ? new Date() : null,
	};
}
