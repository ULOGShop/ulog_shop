import {Container, Group, Text, Anchor, Box} from "@mantine/core"
import {IconBrandDiscord} from "@tabler/icons-react"

export default function Footer() {
    return (
        <Box component="footer" style={{position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, backgroundColor: "rgba(17, 17, 17, 0.7)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", borderTop: "1px solid rgba(186, 243, 41, 0.2)", boxShadow: "0 -8px 32px 0 rgba(0, 0, 0, 0.37)"}}>
            <Container size="lg" py="md">
                <Group justify="space-between">
                    <Text size="sm" c="#666666">
                        2025 © ULOG Studios - All Rights Reserved. We are not affiliated with Rockstar Games
                    </Text>
                    <Group gap="xl">
                        <Anchor href="https://discord.gg/yourserver" target="_blank" size="sm" c="#666666" style={{textDecoration: "none", transition: "color 0.2s ease"}} onMouseEnter={(e) => {e.currentTarget.style.color = "#BAF329"}} onMouseLeave={(e) => {e.currentTarget.style.color = "#666666"}}>
                            <Group gap="xs">
                                <IconBrandDiscord size={16}/>
                                Discord
                            </Group>
                        </Anchor>
                    </Group>
                </Group>
            </Container>
        </Box>
    )
}