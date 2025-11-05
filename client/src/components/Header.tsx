import {useState} from "react"
import {Link, useLocation} from "react-router-dom"
import {Group, Button, Burger, Drawer, Stack, Menu, Avatar, Text, Box} from "@mantine/core"
import {IconUser, IconLogout, IconChevronDown, IconBrandDiscord} from "@tabler/icons-react"
import {useAuth} from "@/contexts/AuthContext"

export default function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [accountMenuOpen, setAccountMenuOpen] = useState(false)
    const location = useLocation()
    const {discordUser, cfxUser, login, logoutDiscord, logoutCFX} = useAuth()

    const navItems = [
        {path: "/", label: "Home"},
        {path: "/products", label: "Products"},
        {path: "/faq", label: "FAQ"},
    ]

    const isActive = (path: string) => location.pathname === path

    return (
        <Box component="header" style={{position: "sticky", top: 0, left: 0, right: 0, zIndex: 100, backgroundColor: "rgba(17, 17, 17, 0.7)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderBottom: "1px solid rgba(186, 243, 41, 0.2)", boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)"}}>
            <Group h={70} px="md" justify="space-between" align="center">
                <Link to="/" style={{textDecoration: "none"}}>
                    <Group gap="sm">
                        <img src="/ULOG_LOGO.png" alt="ULOG Store" style={{height: "45px", width: "auto", objectFit: "contain"}}/>
                    </Group>
                </Link>
                <Group gap="xs" visibleFrom="sm" align="center">
                    {navItems.map((item) => (
                        <Button key={item.path} component={Link} to={item.path} variant={isActive(item.path) ? "filled" : "subtle"} styles={{root: {...(isActive(item.path) ? {background: "#BAF329", color: "#111111", fontWeight: 600} : {color: "#FFFFFF", background: "transparent"}), "&:hover": {background: isActive(item.path) ? "#BAF329" : "#1a1a1a"}}}}>
                            {item.label}
                        </Button>
                    ))}
                </Group>
                <Group gap="xs" visibleFrom="sm" align="center">
                    <Menu opened={accountMenuOpen} onChange={setAccountMenuOpen} position="bottom-end" shadow="md" width={280}>
                        <Menu.Target>
                            <Button variant="light" color="gray" rightSection={<IconChevronDown size={16}/>} leftSection={<IconUser size={16}/>}>
                                Account
                            </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            {!discordUser && !cfxUser ? (
                                <>
                                    <Menu.Item leftSection={<IconUser size={16}/>} onClick={() => {login("cfx"), setAccountMenuOpen(false)}}>
                                        <div>
                                            <Text size="sm" fw={500}>
                                                CFX Account
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Login with FiveM
                                            </Text>
                                        </div>
                                    </Menu.Item>
                                    <Menu.Item leftSection={<IconBrandDiscord size={16}/>} onClick={() => {login("discord"), setAccountMenuOpen(false)}}>
                                        <div>
                                            <Text size="sm" fw={500}>
                                                Discord
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Login with Discord
                                            </Text>
                                        </div>
                                    </Menu.Item>
                                </>
                            ) : (
                                <>
                                    {discordUser && (
                                        <>
                                            <Menu.Label>Discord Account</Menu.Label>
                                            <Box px="sm" py="xs">
                                                <Group gap="sm">
                                                    <Avatar src={discordUser.avatar} size="md" radius="xl"/>
                                                    <div>
                                                        <Text size="sm" fw={500}>
                                                            {discordUser.username}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            Discord
                                                        </Text>
                                                    </div>
                                                </Group>
                                            </Box>
                                            <Menu.Item color="red" leftSection={<IconLogout size={16}/>} onClick={() => {logoutDiscord(), setAccountMenuOpen(false)}}>
                                                Logout Discord
                                            </Menu.Item>
                                            <Menu.Divider/>
                                        </>
                                    )}
                                    {cfxUser && (
                                        <>
                                            <Menu.Label>CFX Account</Menu.Label>
                                            <Box px="sm" py="xs">
                                                <Group gap="sm">
                                                    <Avatar src={cfxUser.avatar} size="md" radius="xl"/>
                                                    <div>
                                                        <Text size="sm" fw={500}>
                                                            {cfxUser.username}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            CFX
                                                        </Text>
                                                    </div>
                                                </Group>
                                            </Box>
                                            <Menu.Item color="red" leftSection={<IconLogout size={16}/>} onClick={() => {logoutCFX(), setAccountMenuOpen(false)}}>
                                                Logout CFX
                                            </Menu.Item>
                                            <Menu.Divider/>
                                        </>
                                    )}
                                    {!cfxUser && (
                                        <Menu.Item leftSection={<IconUser size={16}/>} onClick={() => {login("cfx"), setAccountMenuOpen(false)}}>
                                            <div>
                                                <Text size="sm" fw={500}>
                                                    CFX Account
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    Login with FiveM
                                                </Text>
                                            </div>
                                        </Menu.Item>
                                    )}
                                    {!discordUser && (
                                        <Menu.Item leftSection={<IconBrandDiscord size={16}/>} onClick={() => {login("discord"), setAccountMenuOpen(false)}}>
                                            <div>
                                                <Text size="sm" fw={500}>
                                                    Discord
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    Login with Discord
                                                </Text>
                                            </div>
                                        </Menu.Item>
                                    )}
                                </>
                            )}
                        </Menu.Dropdown>
                    </Menu>
                </Group>
                <Burger opened={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} hiddenFrom="sm" color="#BAF329"/>
            </Group>
            <Drawer opened={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} position="right" title="Menu" padding="md" hiddenFrom="sm">
                <Stack>
                    {navItems.map((item) => (
                        <Button key={item.path} component={Link} to={item.path} variant={isActive(item.path) ? "filled" : "subtle"} onClick={() => setMobileMenuOpen(false)} fullWidth styles={{root: {...(isActive(item.path) ? {background: "#BAF329", color: "#111111", fontWeight: 600} : {color: "#FFFFFF", background: "transparent"})}}}>
                            {item.label}
                        </Button>
                    ))}
                    {!discordUser && !cfxUser ? (
                        <>
                            <Button variant="light" color="gray" leftSection={<IconUser size={16}/>} onClick={() => {login("cfx"), setMobileMenuOpen(false)}} fullWidth>
                                Login with CFX
                            </Button>
                            <Button variant="light" color="gray" leftSection={<IconBrandDiscord size={16}/>} onClick={() => {login("discord"), setMobileMenuOpen(false)}} fullWidth>
                                Login with Discord
                            </Button>
                        </>
                    ) : (
                        <>
                            {discordUser && (
                                <Box p="sm" style={{border: "1px solid #333", borderRadius: "8px"}}>
                                    <Group gap="sm" mb="xs">
                                        <Avatar src={discordUser.avatar} size="sm" radius="xl"/>
                                        <div>
                                            <Text size="sm" fw={500}>
                                                {discordUser.username}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Discord
                                            </Text>
                                        </div>
                                    </Group>
                                    <Button size="xs" color="red" variant="light" leftSection={<IconLogout size={14}/>} onClick={() => {logoutDiscord(), setMobileMenuOpen(false)}} fullWidth>
                                        Logout Discord
                                    </Button>
                                </Box>
                            )}
                            {cfxUser && (
                                <Box p="sm" style={{border: "1px solid #333", borderRadius: "8px"}}>
                                    <Group gap="sm" mb="xs">
                                        <Avatar src={cfxUser.avatar} size="sm" radius="xl"/>
                                        <div>
                                            <Text size="sm" fw={500}>
                                                {cfxUser.username}
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                CFX
                                            </Text>
                                        </div>
                                    </Group>
                                    <Button size="xs" color="red" variant="light" leftSection={<IconLogout size={14}/>} onClick={() => {logoutCFX(), setMobileMenuOpen(false)}} fullWidth>
                                        Logout CFX
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Stack>
            </Drawer>
        </Box>
    )
}