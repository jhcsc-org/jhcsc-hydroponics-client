import { Button, TextField, useTheme } from "@aws-amplify/ui-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import "./../styles/dialog.styles.css";

interface DialogDemoProps {
	setNewLabel: (newLabel: string) => void;
	onRename: (newLabel: string) => void;
	currentLabel: string;
}

const DialogDemo = ({
	setNewLabel,
	onRename,
	currentLabel,
}: DialogDemoProps) => {
	const { tokens } = useTheme();
	const [newLabelValue, setNewLabelValue] = useState(currentLabel);

	const handleSave = () => {
		if (newLabelValue.trim()) {
			try {
				onRename(newLabelValue);
				setNewLabel(newLabelValue);
			} catch (error) {
				console.error("Failed to save new label:", error);
			}
		}
	};

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<Button
					type="button"
					variation="link"
					size="small"
					padding="relative.xxs"
				>
					<FiEdit size={16} />
				</Button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="DialogOverlay" style={{ zIndex: 2000 }} />
				<Dialog.Content className="DialogContent" style={{ zIndex: 2001 }}>
					<Dialog.Title className="DialogTitle">Rename Relay</Dialog.Title>
					<Dialog.Description className="DialogDescription">
						Enter a new name for this relay.
					</Dialog.Description>
					<TextField
						label="New name"
						value={newLabelValue}
						onChange={(e) => setNewLabelValue(e.target.value)}
						marginBottom={tokens.space.medium}
					/>
					<div
						style={{
							display: "flex",
							marginTop: 25,
							justifyContent: "flex-end",
							gap: tokens.space.xs.value,
						}}
					>
						<Dialog.Close asChild>
							<Button type="button" variation="destructive" size="small">
								Cancel
							</Button>
						</Dialog.Close>
						<Dialog.Close asChild>
							<Button
								type="button"
								variation="primary"
								color={tokens.colors.green[60]}
								backgroundColor={tokens.colors.green[20]}
								size="small"
								onClick={handleSave}
							>
								Save changes
							</Button>
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
};

export default DialogDemo;
