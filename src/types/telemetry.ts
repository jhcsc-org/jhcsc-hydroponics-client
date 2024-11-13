export interface TTelemetryMessage {
	temperature: number;
	humidity: number;
	light_level: number;
	ph_levels: number[];
	relay_states: boolean[];
}

export type DataViewType = keyof Omit<TTelemetryMessage, "relay_states">;
export type ChartViewType = "line" | "bar" | "radar";
