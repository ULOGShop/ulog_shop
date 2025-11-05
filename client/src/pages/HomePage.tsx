import {Container, Title, Text, Button, Stack, Group, Box, Paper, Avatar} from "@mantine/core"
import {IconShoppingBag, IconBolt, IconUser} from "@tabler/icons-react"
import {Link} from "react-router-dom"
import {useState, useEffect, useRef} from "react"

interface Payment {
    id: number
    player: {
        name: string
        id?: string
        uuid?: string
    }
    amount: string
    date: string
    currency: {
        iso_4217: string
    }
    packages: Array<{
        name: string
    }>
}

interface AvatarErrors {
    [key: number]: boolean
}

export default function HomePage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [avatarErrors, setAvatarErrors] = useState<AvatarErrors>({})
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"
                const response = await fetch(`${backendUrl}/api/tebex/payments/recent?limit=6`)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                setPayments(data || [])
            } catch (error) {
                setPayments([])
            } finally {
                setLoading(false)
            }
        }

        fetchPayments()
    }, [])

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMinutes = Math.floor(diffMs/(1000*60))
        const diffHours = Math.floor(diffMs/(1000*60*60))
        const diffDays = Math.floor(diffMs/(1000*60*60*24))
        if (diffMinutes < 1) return "Just now"
        if (diffMinutes < 60) return `${diffMinutes}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    const getCfxAvatarUrl = (username: string, fivemId: string) => {
        const lowercaseUsername = username.toLowerCase()
        return `https://forum.cfx.re/user_avatar/forum.cfx.re/${lowercaseUsername}/256/${fivemId}_2.png`
    }

    const handleAvatarError = (paymentId: number) => {
        setAvatarErrors(prev => ({ ...prev, [paymentId]: true}))
    }

    return (
        <Box>
            <Container size="lg" py={80}>
                <Stack align="center" gap="xl">
                    <Title order={1} size={60} fw={900} ta="center" style={{background: "linear-gradient(45deg, #BAF329 0%, #8BC220 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"}}>
                        Welcome to ULOG Store
                    </Title>
                    <Text size="xl" c="#FFFFFF" ta="center" maw={600}>
                        Discover exclusive packages and enhance your gaming experience with our
                        premium products
                    </Text>
                    <Group mt="xl">
                        <Button component={Link} to="/products" size="xl" leftSection={<IconShoppingBag size={24}/>} styles={{root: {background: "#BAF329", color: "#111111", fontWeight: 700, "&:hover": {background: "#a8db25"}}}}>
                            Browse Products
                        </Button>
                        <Button component={Link} to="/products" size="xl" variant="outline" leftSection={<IconBolt size={24}/>} styles={{root: {borderColor: "#BAF329", color: "#BAF329", "&:hover": {background: "rgba(186, 243, 41, 0.1)"}}}}>
                            Featured Deals
                        </Button>
                    </Group>
                    <Group mt={80} grow>
                        <Stack align="center" gap="sm">
                            <IconShoppingBag size={48} color="#BAF329"/>
                            <Title order={3} c="#FFFFFF">Premium Products</Title>
                            <Text c="#FFFFFF" ta="center">
                                High-quality packages for your server
                            </Text>
                        </Stack>
                        <Stack align="center" gap="sm">
                            <IconBolt size={48} color="#BAF329"/>
                            <Title order={3} c="#FFFFFF">Instant Delivery</Title>
                            <Text c="#FFFFFF" ta="center">
                                Get your products delivered immediately
                            </Text>
                        </Stack>
                        <Stack align="center" gap="sm">
                            <IconShoppingBag size={48} color="#BAF329"/>
                            <Title order={3} c="#FFFFFF">Secure Payment</Title>
                            <Text c="#FFFFFF" ta="center">
                                Safe and encrypted transactions
                            </Text>
                        </Stack>
                    </Group>
                </Stack>
            </Container>
            {!loading && (
                <Container size="xl" py={60}>
                    <Stack align="center" gap="xl" w="100%">
                        <Box style={{textAlign: "center"}}>
                            <Title order={2} size="2.5rem" c="#FFFFFF" mb="md">
                                Latest Purchases
                            </Title>
                            <Text size="lg" c="#FFFFFF" maw={600} mx="auto">
                                See what other players are buying right now
                            </Text>
                        </Box>
                        {payments.length === 0 ? (
                            <Text c="#666666" size="lg">
                                No recent purchases yet
                            </Text>
                        ) : (
                            <Box w="100%" style={{overflow: "hidden", position: "relative", maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)"}}>
                                <Box ref={scrollRef} style={{display: "flex", gap: "1rem", animation: "scroll 20s linear infinite", width: "max-content"}}>
                                    {[...Array(3)].map((_, duplicateIndex) => (
                                        payments.map((payment, index) => (
                                            <Paper key={`payment-${duplicateIndex}-${payment.id}-${index}`} p="xl" radius="sm" style={{background: "rgba(26, 26, 26, 0.5)", backdropFilter: "blur(10px)", border: "1px solid #2a2a2a", transition: "all 0.3s ease", minWidth: "350px", flex: "0 0 auto"}} onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-4px)", e.currentTarget.style.borderColor = "rgba(186, 243, 41, 0.3)"}} onMouseLeave={(e) => {e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.borderColor = "#2a2a2a"}}>
                                                <Group justify="space-between" mb="md">
                                                    <Group gap="sm">
                                                        <Box style={{position: "relative"}}>
                                                            {payment.player?.id && payment.player?.name && !avatarErrors[payment.id] ? (
                                                                <Avatar src={getCfxAvatarUrl(payment.player.name, payment.player.id)} size="lg" radius="xl" onError={() => handleAvatarError(payment.id)}>
                                                                    <IconUser size={24}/>
                                                                </Avatar>
                                                            ) : (
                                                                <Avatar size="lg" radius="xl" style={{background: "linear-gradient(135deg, rgba(186, 243, 41, 0.2), rgba(186, 243, 41, 0.05))"}}>
                                                                    <IconUser size={24} color="#BAF329"/>
                                                                </Avatar>
                                                            )}
                                                            <Box style={{position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", background: "#BAF329", borderRadius: "50%", border: "2px solid #111111"}}/>
                                                        </Box>
                                                        <div>
                                                            <Text fw={600} c="#FFFFFF" size="sm">
                                                                {payment.player?.name || "Anonymous"}
                                                            </Text>
                                                            <Text size="xs" c="#666666">
                                                                {formatTimeAgo(payment.date)}
                                                            </Text>
                                                        </div>
                                                    </Group>
                                                    <Text fw={700} c="#BAF329" size="lg">
                                                        {parseFloat(payment.amount || "0") === 0 ? "FREE" : `${payment.amount} ${payment.currency?.iso_4217 || "EUR"}`}
                                                    </Text>
                                                </Group>
                                                <Box pt="md" style={{borderTop: "1px solid rgba(42, 42, 42, 0.5)"}}>
                                                    <Text c="#FFFFFF" fw={500} lineClamp={1}>
                                                        {payment.packages?.[0]?.name || "Unknown Package"}
                                                    </Text>
                                                </Box>
                                            </Paper>
                                        ))
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Stack>
                </Container>
            )}
        </Box>
    )
}