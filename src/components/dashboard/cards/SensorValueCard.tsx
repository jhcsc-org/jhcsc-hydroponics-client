import { Card, Placeholder, Text, useTheme } from "@aws-amplify/ui-react";

interface SensorValueCardProps {
	value: number | null;
	label: string;
	unit: string;
	isLoading: boolean;
}

export function SensorValueCard({
	value,
	label,
	unit,
	isLoading,
}: SensorValueCardProps) {
	const { tokens } = useTheme();

	return (
		<Card
			variation="outlined"
			backgroundColor={tokens.colors.background.primary}
			borderColor={tokens.colors.border.secondary}
			padding={tokens.space.medium}
		>
			<Text variation="secondary">{label}</Text>
			{isLoading ? (
				<Placeholder size="small" />
			) : (
				<Text
					fontSize={tokens.fontSizes.xxxl}
					opacity={value === null ? 0.5 : 1}
				>
					{value !== null ? value.toFixed(1) : "—"} {unit}
				</Text>
			)}
		</Card>
	);
}
