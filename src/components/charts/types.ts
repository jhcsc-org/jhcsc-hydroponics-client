export interface TTelemetryMessage {
	temperature: number;
	humidity: number;
	light_level: number;
	ph_levels: number[];
	relay_states: boolean[];
}

export type ChartViewType = "line" | "bar" | "radar";
export type DataViewType = keyof Omit<TTelemetryMessage, "relay_states">;

export interface ChartConfig {
	borderColor?: string;
	backgroundColor?: string;
	tension?: number;
	fill?: boolean;
}

export interface TelemetryChartProps {
	data: TTelemetryMessage;
	dataView: DataViewType;
	chartView?: ChartViewType;
	title?: string;
	config?: ChartConfig;
	height?: number;
	width?: number;
}
