import { Button, Card, Heading, Text, useTheme } from "@aws-amplify/ui-react";

export function ConfigurationPanel() {
	const { tokens } = useTheme();

	return (
		<Card
			variation="outlined"
			borderColor={tokens.colors.border.secondary}
			borderRadius={tokens.radii.large}
			padding={tokens.space.medium}
		>
			<Heading level={4} color={tokens.colors.font.primary}>
				Configuration
			</Heading>
			<Text color={tokens.colors.font.secondary}>
				Use this section to adjust your IoT settings.
			</Text>
			<Button
				variation="primary"
				marginTop={tokens.space.small}
				backgroundColor={tokens.colors.primary[60]}
				color={tokens.colors.font.inverse}
			>
				Configure
			</Button>
		</Card>
	);
}
