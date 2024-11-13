import {
	Badge,
	Button,
	Card,
	Flex,
	Heading,
	useTheme,
} from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import UserDialog from "../Dialog";

type initialState = {
	state: boolean;
	label: string;
};

interface RelayControlCardProps {
	relayName: string;
	initialState: initialState;
	isLoading?: boolean;
	onToggle: (newState: boolean) => Promise<void>;
	onRename: (newName: string) => Promise<void>;
}

export function RelayControlCard({
	relayName,
	initialState,
	isLoading = false,
	onToggle,
	onRename,
}: RelayControlCardProps) {
	const [isOn, setIsOn] = useState<boolean>(initialState.state);
	const [isPending, setIsPending] = useState(false);
	const [label, setLabel] = useState<string>(initialState.label);

	useEffect(() => {
		setIsOn(initialState.state);
		setLabel(initialState.label);
	}, [initialState]);

	const handleToggle = async () => {
		setIsPending(true);
		try {
			await Promise.all([
				new Promise((resolve) => setTimeout(resolve, 300)),
				(async () => {
					await onToggle(!isOn);
					setIsOn(!isOn);
				})(),
			]);
		} catch (error) {
			console.error(`Failed to toggle ${relayName}:`, error);
		} finally {
			setIsPending(false);
		}
	};

	const formattedName = label
		.replace("relay", "Relay ")
		.split("_")
		.map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

	const { tokens } = useTheme();

	const handleRename = async (newName: string) => {
		try {
			await onRename(newName);
			setLabel(newName);
		} catch (error) {
			console.error("Failed to rename relay:", error);
		}
	};

	return (
		<Card
			variation="outlined"
			borderColor={tokens.colors.border.secondary}
			padding={tokens.space.large}
		>
			<Flex direction="column" gap="medium">
				<Flex justifyContent="space-between" alignItems="center">
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: tokens.space.xs.value,
						}}
					>
						<Heading level={5}>{formattedName}</Heading>
						<UserDialog
							setNewLabel={setLabel}
							onRename={handleRename}
							currentLabel={label as string}
						/>
					</div>
					<Badge variation={isOn ? "success" : "error"} size="small">
						{isOn ? "ON" : "OFF"}
					</Badge>
				</Flex>
				<Button
					variation={isOn ? "destructive" : "primary"}
					onClick={handleToggle}
					isLoading={isPending || isLoading}
					loadingText="Updating..."
					size="large"
					isFullWidth
				>
					Turn {isOn ? "Off" : "On"}
				</Button>
			</Flex>
		</Card>
	);
}
