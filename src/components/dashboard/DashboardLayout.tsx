import {
	Button,
	Flex,
	Link,
	Text,
	useAuthenticator,
	useTheme,
} from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { FaLeaf } from "react-icons/fa";
import { FiActivity, FiHome, FiLogOut, FiMenu, FiSettings, FiToggleLeft, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export function Sidebar({
	items,
	isOpen,
	onClose,
}: {
	items: { label: string; href: string; icon: JSX.Element }[];
	isOpen: boolean;
	onClose: () => void;
}) {
	const { tokens } = useTheme();
	const { signOut } = useAuthenticator();

	// Handle clicks outside sidebar on mobile
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const sidebar = document.getElementById("sidebar");
			if (isOpen && sidebar && !sidebar.contains(event.target as Node)) {
				onClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen, onClose]);
	const navigate = useNavigate();
	return (
		<Flex
			id="sidebar"
			direction="column"
			backgroundColor={tokens.colors.background.secondary}
			height="100vh"
			width={{ base: "100%", large: "250px" }}
			justifyContent="space-between"
			padding={tokens.space.medium}
			position="fixed"
			left="0"
			top="0"
			transform={{
				base: isOpen ? "translateX(0)" : "translateX(-100%)",
				large: "translateX(0)",
			}}
			style={{
				zIndex: 1000,
			}}
		>
			<Flex direction="column">
				<Flex
					justifyContent="space-between"
					alignItems="center"
					marginTop={tokens.space.xs}
				>
					<Text
						fontSize={tokens.fontSizes.xl}
						fontWeight={tokens.fontWeights.normal}
						color={tokens.colors.font.success}
						textAlign="center"
						paddingLeft={tokens.space.xs}
					>
						<FaLeaf style={{ marginRight: tokens.space.small.value, marginBottom: "-2px" }} />
						Hydroponics
					</Text>
					<Button
						onClick={onClose}
						display={{ base: "block", large: "none" }}
						variation="link"
					>
						<FiX />
					</Button>
				</Flex>
				<Flex direction="column" gap={tokens.space.xxs}>
					{items.map((item, index) => (
						<Link
							key={`${item.label}-${index}`}
							fontSize={tokens.fontSizes.medium}
							color={
								location.pathname === item.href
									? tokens.colors.primary[80]
									: tokens.colors.font.primary
							}
							textDecoration="none"
							padding={tokens.space.xs}
							backgroundColor={
								location.pathname === item.href
									? tokens.colors.background.tertiary
									: "transparent"
							}
							fontWeight={
								location.pathname === item.href
									? tokens.fontWeights.medium
									: tokens.fontWeights.normal
							}
							borderRadius={tokens.radii.small}
							onClick={() => {
								navigate(item.href);
								onClose();
							}}
						>
							<Flex alignItems="center" gap="xs">
								{item.icon}
								<Text
									color={
										location.pathname === item.href
											? tokens.colors.primary[80]
											: tokens.colors.font.primary
									}
								>
									{item.label}
								</Text>
							</Flex>
						</Link>
					))}
				</Flex>
			</Flex>
			<Button onClick={signOut} variation="primary" size="small" width="100%">
				<FiLogOut style={{ marginRight: tokens.space.xs.value }} />
				Logout
			</Button>
		</Flex>
	);
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { tokens } = useTheme();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	return (
		<Flex direction="row" width="100%" minHeight="100vh">
			<Button
				onClick={() => setIsSidebarOpen(true)}
				display={{ base: "block", large: "none" }}
				position="fixed"
				top={tokens.space.medium}
				left={tokens.space.medium}
				backgroundColor={tokens.colors.background.primary}
				borderRadius={tokens.radii.small}
				paddingTop={tokens.space.small}
			>
				<FiMenu />
			</Button>
			<Sidebar
				items={[
					{ label: "Dashboard", href: "/", icon: <FiHome /> },
					{ label: "Sensors", href: "/sensors", icon: <FiActivity /> },
					{ label: "Relays", href: "/relays", icon: <FiToggleLeft /> },
					{ label: "Settings", href: "/settings", icon: <FiSettings /> },
				]}
				isOpen={isSidebarOpen}
				onClose={() => setIsSidebarOpen(false)}
			/>
			<Flex
				direction="column"
				flex="1"
				marginLeft={{ base: "0", large: "250px" }}
				padding={{
					base: `${tokens.space.xl} ${tokens.space.medium}`,
					large: tokens.space.xl,
				}}
				backgroundColor={tokens.colors.background.primary}
			>
				{children}
			</Flex>
		</Flex>
	);
}
