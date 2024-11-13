/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
import {
	BarElement,
	CategoryScale,
	Chart as ChartJS,
	Legend,
	LineElement,
	LinearScale,
	PointElement,
	RadialLinearScale,
	Title,
	Tooltip,
} from "chart.js";
import type React from "react";
import { useMemo } from "react";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	RadialLinearScale,
	Title,
	Tooltip,
	Legend,
);

export interface TTelemetryMessage {
	temperature: number;
	humidity: number;
	light_level: number;
	ph_levels: number[];
	relay_states: boolean[];
}

export type ChartViewType = "line" | "bar" | "radar" | "stacked" | "multiple";
export type DataViewType = keyof Omit<TTelemetryMessage, "relay_states">;

export interface ChartConfig {
	borderColor?: string;
	backgroundColor?: string;
	tension?: number;
	fill?: boolean;
	timeseriesLength?: number;
}

export interface TelemetryChartProps {
	data: TTelemetryMessage;
	dataView: DataViewType;
	chartView?: ChartViewType;
	title?: string;
	config?: ChartConfig;
	height?: number;
	width?: number;
	showNumerical?: boolean;
}

const DEFAULT_COLORS = {
	temperature: "rgb(255, 99, 132)",
	humidity: "rgb(54, 162, 235)",
	light_level: "rgb(255, 206, 86)",
	ph_levels: [
		"rgb(75, 192, 192)",
		"rgb(153, 102, 255)",
		"rgb(255, 159, 64)",
		"rgb(201, 203, 207)",
		"rgb(54, 162, 235)",
	],
};

const DEFAULT_CONFIG = {
	tension: 0.1,
	fill: false,
	timeseriesLength: 20,
};

const UNITS = {
	temperature: "°C",
	humidity: "%",
	light_level: "lux",
	ph_levels: "pH",
};

function generateTimeLabels(length: number): string[] {
	const now = new Date();
	return Array.from({ length }, (_, i) => {
		const date = new Date(now.getTime() - (length - 1 - i) * 1000);
		return date.toLocaleTimeString();
	});
}

function formatValue(value: number, dataView: DataViewType): string {
	return `${value.toFixed(2)}${UNITS[dataView] || ""}`;
}

const NumericalDisplay: React.FC<{
	value: number;
	label: string;
	unit: string;
}> = ({ value, label, unit }) => (
	<div className="bg-white p-4 rounded-lg shadow">
		<div className="text-sm text-gray-500">{label}</div>
		<div className="text-2xl font-bold">
			{value.toFixed(2)}
			{unit}
		</div>
	</div>
);

const PhLevelsDisplay: React.FC<{
	data: number[];
	chartView: ChartViewType;
	config?: ChartConfig;
}> = ({ data, chartView, config }) => {
	const labels = generateTimeLabels(
		config?.timeseriesLength || DEFAULT_CONFIG.timeseriesLength,
	);

	const datasets = useMemo(() => {
		if (chartView === "stacked") {
			return data.map((_, index) => ({
				label: `Sensor ${index + 1}`,
				data: Array(labels.length).fill(data[index]),
				backgroundColor:
					DEFAULT_COLORS.ph_levels[index % DEFAULT_COLORS.ph_levels.length],
				stack: "Stack 0",
			}));
		}

		if (chartView === "multiple" || chartView === "line") {
			return data.map((_, index) => ({
				label: `Sensor ${index + 1}`,
				data: Array(labels.length).fill(data[index]),
				borderColor:
					DEFAULT_COLORS.ph_levels[index % DEFAULT_COLORS.ph_levels.length],
				backgroundColor: `${DEFAULT_COLORS.ph_levels[index % DEFAULT_COLORS.ph_levels.length]}33`,
				fill: false,
			}));
		}

		return [];
	}, [data, chartView, labels.length]);

	const options = {
		responsive: true,
		interaction: {
			mode: "index" as const,
			intersect: false,
		},
		plugins: {
			title: {
				display: true,
				text: "pH Levels",
			},
			legend: {
				position: "top" as const,

				onClick: (
					e: any,
					legendItem: { datasetIndex: any; hidden: boolean },
					legend: { chart: any },
				) => {
					const index = legendItem.datasetIndex;
					const ci = legend.chart;
					if (ci.isDatasetVisible(index)) {
						ci.hide(index);
						legendItem.hidden = true;
					} else {
						ci.show(index);
						legendItem.hidden = false;
					}
					ci.update();
				},
			},
			tooltip: {
				mode: "index",
				intersect: false,
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					callback: (value: number) => `${value.toFixed(2)} pH`,
				},
				stacked: chartView === "stacked",
			},
			x: {
				stacked: chartView === "stacked",
			},
		},
	};

	const chartData = {
		labels,
		datasets,
	};

	const ChartComponent = chartView === "stacked" ? Bar : Line;
	return <ChartComponent data={chartData} options={options} />;
};

export function TelemetryChart({
	data,
	dataView,
	chartView = "line",
	title,
	config = DEFAULT_CONFIG,
	height,
	width,
	showNumerical = true,
}: TelemetryChartProps) {
	const timeLabels = generateTimeLabels(
		config.timeseriesLength || DEFAULT_CONFIG.timeseriesLength,
	);

	const singleValueChartData = {
		labels: timeLabels,
		datasets: [
			{
				label: formatLabel(dataView),
				data: Array(timeLabels.length).fill(
					data[dataView as keyof TTelemetryMessage],
				),
				borderColor: config.borderColor || DEFAULT_COLORS[dataView],
				backgroundColor:
					config.backgroundColor || `${DEFAULT_COLORS[dataView]}33`,
				tension: config.tension,
				fill: config.fill,
			},
		],
	};

	const singleValueOptions = {
		responsive: true,
		maintainAspectRatio: false,
		interaction: {
			mode: "index" as const,
			intersect: false,
		},
		plugins: {
			title: {
				display: !!title,
				text: title || formatLabel(dataView),
			},
			legend: {
				position: "top" as const,
				onClick: (e: any, legendItem: any, legend: any) => {
					const index = legendItem.datasetIndex;
					const ci = legend.chart;
					if (ci.isDatasetVisible(index)) {
						ci.hide(index);
						legendItem.hidden = true;
					} else {
						ci.show(index);
						legendItem.hidden = false;
					}
					ci.update();
				},
			},
			tooltip: {
				mode: "index",
				intersect: false,
				callbacks: {
					label: (context: any) => {
						const label = context.dataset.label || "";
						return `${label}: ${formatValue(context.parsed.y, dataView)}`;
					},
				},
			},
		},
		scales: {
			y: {
				beginAtZero: true,
				ticks: {
					callback: (value: number) => formatValue(value, dataView),
				},
			},
		},
	};

	return (
		<div className="space-y-4">
			{}
			{showNumerical && dataView !== "ph_levels" && (
				<NumericalDisplay
					value={data[dataView as keyof TTelemetryMessage] as number}
					label={formatLabel(dataView)}
					unit={UNITS[dataView]}
				/>
			)}

			{}
			<div style={{ height: height || 400, width: width || "100%" }}>
				{dataView === "ph_levels" ? (
					<PhLevelsDisplay
						data={data.ph_levels}
						chartView={chartView}
						config={config}
					/>
				) : (
					<Line data={singleValueChartData} options={singleValueOptions} />
				)}
			</div>
		</div>
	);
}

function formatLabel(key: string): string {
	return key
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export default TelemetryChart;
