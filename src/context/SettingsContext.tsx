import { createContext, useContext, useEffect, useState } from "react";
import { TOPICS } from "../constants/mqtt-topics";
import { usePubSubContext } from "./PubSubContext";

export interface PhThresholds {
	tooAcidic: number;
	slightlyAcidic: number;
	optimal: number;
	slightlyAlkaline: number;
	tooAlkaline: number;
}

export interface SensorCalibration {
	offset: number;
	slope: number;
}

export interface Settings {
	phThresholds: PhThresholds;
	phSensorCalibration: Record<string, SensorCalibration>;
	temperatureUnit: "celsius" | "fahrenheit";
	lightUnit: "lux" | "percentage";
}

export const FACTORY_DEFAULTS: Settings = {
	phThresholds: {
		tooAcidic: 5.5,
		slightlyAcidic: 6.0,
		optimal: 7.0,
		slightlyAlkaline: 7.5,
			tooAlkaline: 8.0,
	},
	phSensorCalibration: {
		sensor1: { offset: 0, slope: 1 },
		sensor2: { offset: 0, slope: 1 },
		sensor3: { offset: 0, slope: 1 },
		sensor4: { offset: 0, slope: 1 },
	},
	temperatureUnit: "celsius",
	lightUnit: "lux",
};

interface SettingsContextType {
	settings: Settings;
	updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
	updatePhThresholds: (newThresholds: Partial<PhThresholds>) => Promise<void>;
	updatePhCalibration: (sensorId: string, calibration: Partial<SensorCalibration>) => Promise<void>;
	resetToDefaults: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const pubSub = usePubSubContext();
	const [settings, setSettings] = useState<Settings>(() => {
		const savedSettings = localStorage.getItem("appSettings");
		return savedSettings ? JSON.parse(savedSettings) : FACTORY_DEFAULTS;
	});

	// Subscribe to shadow updates
	useEffect(() => {
		const subscription = pubSub.subscribe({ 
			topics: [TOPICS.shadow.getAccepted, TOPICS.shadow.updateAccepted] 
		}).subscribe({
			next: (data: any) => {
				if (data.state?.desired?.client?.parameters) {
					const shadowSettings = data.state.desired.client.parameters;
					setSettings(prev => ({
						...prev,
						...shadowSettings,
					}));
				}
			},
		});

		return () => subscription.unsubscribe();
	}, [pubSub]);

	// Update shadow when settings change
	const updateShadow = async (newSettings: Settings) => {
		try {
			const shadowUpdate = {
				state: {
					desired: {
						client: {
							parameters: {
								phThresholds: newSettings.phThresholds,
								phSensorCalibration: newSettings.phSensorCalibration,
								temperatureUnit: newSettings.temperatureUnit,
								lightUnit: newSettings.lightUnit,
							}
						}
					}
				}
			};

			await pubSub.publish({
				topics: [TOPICS.shadow.update],
				message: shadowUpdate,
			});

			localStorage.setItem("appSettings", JSON.stringify(newSettings));
		} catch (error) {
			console.error("Failed to update shadow settings:", error);
			throw error;
		}
	};

	const updateSettings = async (newSettings: Partial<Settings>) => {
		const updatedSettings = { ...settings, ...newSettings };
		setSettings(updatedSettings);
		await updateShadow(updatedSettings);
	};

	const updatePhThresholds = async (newThresholds: Partial<PhThresholds>) => {
		const updatedSettings = {
			...settings,
			phThresholds: { ...settings.phThresholds, ...newThresholds },
		};
		setSettings(updatedSettings);
		await updateShadow(updatedSettings);
	};

	const updatePhCalibration = async (
		sensorId: string,
		calibration: Partial<SensorCalibration>,
	) => {
		const updatedSettings = {
			...settings,
			phSensorCalibration: {
				...settings.phSensorCalibration,
				[sensorId]: { ...settings.phSensorCalibration[sensorId], ...calibration },
			},
		};
		setSettings(updatedSettings);
		await updateShadow(updatedSettings);
	};

	const resetToDefaults = async () => {
		try {
			await updateSettings(FACTORY_DEFAULTS);
		} catch (error) {
			console.error("Failed to reset to defaults:", error);
			throw error;
		}
	};

	return (
		<SettingsContext.Provider
			value={{
				settings,
				updateSettings,
				updatePhThresholds,
				updatePhCalibration,
				resetToDefaults,
			}}
		>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	const context = useContext(SettingsContext);
	if (context === undefined) {
		throw new Error("useSettings must be used within a SettingsProvider");
	}
	return context;
}
