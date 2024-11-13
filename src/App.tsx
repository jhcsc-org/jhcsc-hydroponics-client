import { Authenticator } from "@aws-amplify/ui-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./components/dashboard/DashboardLayout";
import { DashboardPage } from "./components/dashboard/DashboardPage";
import { RelaysPage } from "./components/dashboard/RelaysPage";
import { SensorsPage } from "./components/dashboard/SensorsPage";
import { SettingsPage } from "./components/dashboard/SettingsPage";
import { PubSubProvider } from "./context/PubSubContext";
import { SettingsProvider } from "./context/SettingsContext";

const pubSubConfig = {
	region: "ap-southeast-1",
	endpoint: "wss://a2m4ciprmhazub-ats.iot.ap-southeast-1.amazonaws.com/mqtt",
};

function App() {
	return (
		<Authenticator>
			{() => (
				<SettingsProvider>
					<PubSubProvider config={pubSubConfig}>
						<BrowserRouter>
							<DashboardLayout>
								<Routes>
									<Route path="/" element={<DashboardPage />} />
									<Route path="/sensors" element={<SensorsPage />} />
									<Route path="/relays" element={<RelaysPage />} />
									<Route path="/settings" element={<SettingsPage />} />
									<Route path="*" element={<Navigate to="/" replace />} />
								</Routes>
							</DashboardLayout>
						</BrowserRouter>
					</PubSubProvider>
				</SettingsProvider>
			)}
		</Authenticator>
	);
}

export default App;
