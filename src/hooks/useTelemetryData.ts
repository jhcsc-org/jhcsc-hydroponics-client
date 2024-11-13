import { useEffect, useState } from "react";
import type { TTelemetryMessage } from "../types/telemetry";
import { useSubscribe } from "./useSubscribe";

const HISTORY_LIMIT = 50;

export function useTelemetryData(topic: string) {
	const { message } = useSubscribe<TTelemetryMessage>(topic);
	const [temperatureHistory, setTemperatureHistory] = useState<number[]>([]);
	const [phHistory, setPhHistory] = useState<number[][]>([[], [], [], []]);
	const [humidityHistory, setHumidityHistory] = useState<number[]>([]);
	const [lightHistory, setLightHistory] = useState<number[]>([]);

	useEffect(() => {
		if (!message) return;

		setTemperatureHistory((prev) =>
			[...prev, message.temperature].slice(-HISTORY_LIMIT),
		);
		setPhHistory((prev) =>
			message.ph_levels.map((ph, i) =>
				[...(prev[i] || []), ph].slice(-HISTORY_LIMIT),
			),
		);
		setHumidityHistory((prev) =>
			[...prev, message.humidity].slice(-HISTORY_LIMIT),
		);
		setLightHistory((prev) =>
			[...prev, message.light_level].slice(-HISTORY_LIMIT),
		);
	}, [message]);

	return {
		currentData: message,
		temperatureHistory,
		phHistory,
		humidityHistory,
		lightHistory,
	};
}
