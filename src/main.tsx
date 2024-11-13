import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import React from "react";
import ReactDOM from "react-dom/client";
import outputs from "../amplify_outputs.json";
import App from "./App.tsx";
import { PubSubProvider } from "./context/PubSubContext";
import "./index.css";

Amplify.configure({
	...outputs,
	API: {
		GraphQL: {
			endpoint: 'https://5lxswnb3uff4dd5mgiknlcdonq.appsync-api.ap-southeast-1.amazonaws.com/graphql',
			region: 'ap-southeast-1',
			defaultAuthMode: 'apiKey',
			apiKey: 'da2-surnffwezzbhxp4bogmonbfqhm'
		}
	}
});

const pubSubConfig = {
	region: "ap-southeast-1",
	endpoint: "wss://a2m4ciprmhazub-ats.iot.ap-southeast-1.amazonaws.com/mqtt",
};

// biome-ignore lint/style/noNonNullAssertion: this is not a problem
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Authenticator>
			{() => (
				<main>
					<PubSubProvider config={pubSubConfig}>
						<App />
					</PubSubProvider>
				</main>
			)}
		</Authenticator>
	</React.StrictMode>,
);
