import {useEffect, useState} from "react"
import {useParams} from "react-router-dom"
import {Container, Title, Text, Image, Button, Group, Stack, Paper, Loader, Center, Modal, Stepper, rem, Box, Badge, Tabs, SimpleGrid, Avatar, Rating} from "@mantine/core"
import {IconShoppingCart, IconPackage, IconUser, IconBrandDiscord, IconCheck, IconFileDescription, IconListCheck, IconPhoto, IconVideo, IconStar, IconX} from "@tabler/icons-react"
import {tebexApi} from "@/services/api"
import {useCart} from "@/contexts/CartContext"
import {useAuth} from "@/contexts/AuthContext"
import type {TebexPackage} from "@/types"
import {notifications} from "@mantine/notifications"
import productTabsData from "@/data/productTabs.json"
import axios from "axios"
import {sanitizeHTML} from "@/utils/sanitize"
import styles from "./ProductDetailsPage.module.css"

interface TabData {
    id: string
    name: string
    type: string
    content?: string | string[]
    images?: Array<{
        url: string
        alt: string
    }>
}

interface TagObject {
    name: string
    bg: string
    text: string
}

interface Review {
    id: number
    user_username: string
    user_avatar: string | null
    product_name: string
    review_description: string
    rating: number
    created_at: string
}

interface ReviewStats {
    total: number
    averageRating: string
}

export default function ProductDetailsPage() {
    const {id} = useParams<{id: string}>()
    const [product, setProduct] = useState<TebexPackage | null>(null)
    const [loading, setLoading] = useState(true)
    const {addItem, items, removeItem} = useCart()
    const {cfxUser, discordUser, login} = useAuth()
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [authStep, setAuthStep] = useState(0)
    const [activeTab, setActiveTab] = useState<string>("description")
    const [selectedImage, setSelectedImage] = useState<{url: string; alt: string} | null>(null)
    const [reviews, setReviews] = useState<Review[]>([])
    const [reviewStats, setReviewStats] = useState<ReviewStats>({total: 0, averageRating: "0"})
    const [loadingReviews, setLoadingReviews] = useState(false)

    useEffect(() => {
        if (!id) return
        loadProduct(parseInt(id))
    }, [id])

    const loadProduct = async (pkgId: number) => {
        try {
            const res = await tebexApi.getPackage(pkgId)
            setProduct(res.data)
            loadReviews(res.data.name)
        } catch (error) {
            notifications.show({title: "Error", message: "Failed to load product", color: "red"})
        } finally {
            setLoading(false)
        }
    }

    const loadReviews = async (productName: string) => {
        setLoadingReviews(true)
        try {
            const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"
            const response = await axios.get(`${API_URL}/api/reviews/product/${encodeURIComponent(productName)}`)
            if (response.data.success) {
                setReviews(response.data.reviews || [])
                setReviewStats(response.data.stats || { total: 0, averageRating: "0" })
            }
        } catch (error) {} finally {
            setLoadingReviews(false)
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const seconds = Math.floor((now.getTime() - date.getTime())/1000)
        if (seconds < 60) return "just now"
        const minutes = Math.floor(seconds/60)
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes/60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours/24)
        if (days < 30) return `${days}d ago`
        const months = Math.floor(days/30)
        if (months < 12) return `${months}mo ago`
        const years = Math.floor(months/12)
        return `${years}y ago`
    }

    const isInCart = () => {
        if (!product) return false
        return items.some((item) => item.package.id === product.id)
    }

    const requiresDiscord = (): boolean => {
        if (!product) return false
        const description = product.description.toLowerCase()
        return description.includes("discord") || description.includes("role")
    }

    const getProductData = (pkgId: number) => {
        const packagesData = (productTabsData as any).packages || {}
        return packagesData[pkgId.toString()] || null
    }

    const getProductTags = (pkgId: number): Array<TagObject | string> => {
        const productData = getProductData(pkgId)
        return productData?.tags || []
    }

    const getProductTabs = (pkgId: number): TabData[] => {
        const productData = getProductData(pkgId)
        if (!productData?.tabs || productData.tabs.length === 0) {
            return [{id: "description", name: "Description", type: "content", content: "default"}]
        }
        return productData.tabs
    }

    const getTagColor = (tag: TagObject | string) => {
        if (typeof tag === "object") {
            return {name: tag.name, bg: tag.bg, text: tag.text}
        }
        switch (tag.toUpperCase()) {
            case "ESCROW":
            case "ESCROW PROTECTED":
                return {name: tag, bg: "#22c55e", text: "#fff"}
            case "ESX":
                return {name: tag, bg: "#eab308", text: "#000"}
            case "QBCORE":
                return {name: tag, bg: "#dc2626", text: "#fff"}
            case "QBOX":
                return {name: tag, bg: "#d97706", text: "#fff"}
            case "VRP":
                return {name: tag, bg: "#6366f1", text: "#fff"}
            case "STANDALONE":
                return {name: tag, bg: "#8b5cf6", text: "#fff"}
            default:
                return {name: tag, bg: "#6b7280", text: "#fff"}
        }
    }

    const getTabIcon = (tabId: string) => {
        switch (tabId.toLowerCase()) {
            case "description":
                return <IconFileDescription size={16}/>
            case "features":
                return <IconListCheck size={16}/>
            case "showcase":
            case "gallery":
                return <IconPhoto size={16}/>
            case "video":
                return <IconVideo size={16}/>
            default:
                return <IconFileDescription size={16}/>
        }
    }

    const renderTabContent = (tab: TabData) => {
        if (tab.type === "images" && tab.images) {
            return (
                <Box>
                    <SimpleGrid
                        cols={{base: 1, sm: 2, md: 3}} spacing="lg">
                        {tab.images.map((img, idx) => (
                            <Paper key={idx} radius="sm" onClick={() => setSelectedImage(img)} style={{background: "#1a1a1a", border: "1px solid #2a2a2a", overflow: "hidden", cursor: "pointer", transition: "all 0.3s ease"}} onMouseEnter={(e) => {e.currentTarget.style.transform = "scale(1.02)", e.currentTarget.style.borderColor = "#BAF329"}} onMouseLeave={(e) => {e.currentTarget.style.transform = "scale(1)", e.currentTarget.style.borderColor = "#2a2a2a"}}>
                                <Image src={img.url} alt={img.alt} fit="contain"/>
                            </Paper>
                        ))}
                    </SimpleGrid>
                </Box>
            )
        }
        if (tab.content === "default" && product) {
            return (
                <Box dangerouslySetInnerHTML={{__html: sanitizeHTML(product.description)}} style={{color: "#FFFFFF", lineHeight: 1.8}}/>
            )
        }
        if (Array.isArray(tab.content)) {
            return (
                <Box dangerouslySetInnerHTML={{__html: sanitizeHTML(tab.content.join(""))}} style={{color: "#FFFFFF", lineHeight: 1.8}}/>
            )
        }
        return (
            <Box dangerouslySetInnerHTML={{__html: sanitizeHTML(tab.content || "")}} style={{color: "#FFFFFF", lineHeight: 1.8}}/>
        )
    }

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat("pt-PT", {style: "currency", currency: currency === "EUR" ? "EUR" : "USD"}).format(price)
    }

    const handleAddToCart = () => {
        if (!product || isInCart()) return
        if (!cfxUser) {
            setAuthStep(0)
            setShowAuthModal(true)
            return
        }
        if (requiresDiscord() && !discordUser) {
            setAuthStep(1)
            setShowAuthModal(true)
            return
        }
        addItem(product, 1)
        notifications.show({title: "Added to cart", message: product.name, color: "lime"})
    }

    const handleRemoveFromCart = () => {
        if (!product) return
        removeItem(product.id)
        notifications.show({title: "Removed from cart", message: "Item removed successfully", color: "red"})
    }

    const handleCfxLogin = () => {
        login("cfx")
        setShowAuthModal(false)
    }

    const handleDiscordLogin = () => {
        login("discord")
        setShowAuthModal(false)
    }

    if (loading) {
        return (
            <Center h="70vh">
                <Loader color="lime" size="lg"/>
            </Center>
        )
    }

    if (!product) {
        return (
            <Center h="70vh">
                <Stack align="center">
                    <IconPackage size={64} color="#666666"/>
                    <Text c="#666666">Product not found</Text>
                </Stack>
            </Center>
        )
    }

    const tags = getProductTags(product.id)
    const productTabs = getProductTabs(product.id)

    return (
        <Box py={60}>
            <Container size="xl">
                <Stack gap="xl">
                    <Group align="flex-start" gap="xl" wrap="nowrap" style={{flexDirection: "row"}}>
                        <Box style={{background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", overflow: "hidden", position: "relative", flexShrink: 0, maxWidth: "500px"}}>
                            {product.image ? (
                                <Image src={product.image} fit="contain"/>
                            ) : (
                                <Center h={400} bg="#111111">
                                    <IconPackage size={120} color="#2a2a2a"/>
                                </Center>
                            )}
                            {product.sale?.active && (
                                <Badge variant="filled" size="md" radius="sm" color="red" style={{position: "absolute", top: 12, left: 12, fontWeight: 700}}>
                                    -{product.sale.discount}%
                                </Badge>
                            )}
                        </Box>
                        <Stack gap="lg" style={{flex: 1}}>
                            {tags.length > 0 && (
                                <Group gap={6}>
                                    {tags.map((tag, idx) => {
                                        const tagData = getTagColor(tag)
                                        return (
                                            <Badge key={idx} variant="filled" size="sm" radius="sm" styles={{root: {background: tagData.bg, color: tagData.text, textTransform: "uppercase", fontWeight: 700, fontSize: "9px"}}}>
                                                {tagData.name}
                                            </Badge>
                                        )
                                    })}
                                </Group>
                            )}
                            <Title order={1} size="2rem" c="#FFFFFF">
                                {product.name}
                            </Title>
                            <Box style={{background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "20px"}}>
                                <Stack gap="md">
                                    <Box>
                                        {product.discount > 0 && product.price !== 0 ? (
                                            <Stack gap={4}>
                                                <Text size="xs" c="#666666" style={{textDecoration: "line-through"}}>
                                                    {formatPrice(product.price, product.currency)}
                                                </Text>
                                                <Text size="2rem" c="#BAF329" fw={900} style={{lineHeight: 1}}>
                                                    {formatPrice(product.total_price, product.currency)}
                                                </Text>
                                            </Stack>
                                        ) : (
                                            <Text size="2rem" c="#BAF329" fw={900} style={{lineHeight: 1}}>
                                                {product.total_price === 0 ? "FREE" : formatPrice(product.total_price, product.currency)}
                                            </Text>
                                        )}
                                    </Box>
                                    {isInCart() ? (
                                        <Button fullWidth size="lg" radius="sm" color="red" onClick={handleRemoveFromCart} leftSection={<IconShoppingCart size={20}/>}>
                                            Remove from Cart
                                        </Button>
                                    ) : (
                                        <Button fullWidth size="lg" radius="sm" onClick={handleAddToCart} leftSection={<IconShoppingCart size={20}/>} styles={{root: {background: "#BAF329", color: "#111111", fontWeight: 700, "&:hover": {background: "#a8db25"}}}}>
                                            ADD TO CART
                                        </Button>
                                    )}
                                </Stack>
                            </Box>
                        </Stack>
                    </Group>
                    <Box style={{background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "4px", padding: "24px"}}>
                        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || "description")} variant="pills" radius="sm" color="lime" styles={{tab: {color: "#666666", fontWeight: 600, "&[data-active]": {background: "#BAF329", color: "#111111"}, "&:hover:not([data-active])": {background: "#2a2a2a", color: "#FFFFFF"}}, list: {justifyContent: "center"}, panel: {paddingTop: "24px"}}}>
                            <Tabs.List mb="lg">
                                {productTabs.map((tab) => (
                                    <Tabs.Tab key={tab.id} value={tab.id} leftSection={getTabIcon(tab.id)}>
                                        {tab.name}
                                    </Tabs.Tab>
                                ))}
                            </Tabs.List>
                            {productTabs.map((tab) => (
                                <Tabs.Panel key={tab.id} value={tab.id}>
                                    {renderTabContent(tab)}
                                </Tabs.Panel>
                            ))}
                        </Tabs>
                    </Box>
                    <Box>
                        {reviewStats.total > 0 && (
                            <Box style={{background: "linear-gradient(135deg, rgba(186, 243, 41, 0.1), rgba(186, 243, 41, 0.05))", border: "1px solid rgba(186, 243, 41, 0.2)", borderRadius: "8px", padding: "32px", marginBottom: "24px"}}>
                                <Stack gap="lg" align="center">
                                    <Group gap="md" align="center">
                                        <IconStar size={32} color="#BAF329" fill="#BAF329"/>
                                        <Box style={{ textAlign: "center" }}>
                                            <Title order={2} size="2.5rem" c="#BAF329" style={{lineHeight: 1}}>
                                                {reviewStats.averageRating}
                                            </Title>
                                            <Text size="sm" c="#999999" mt={4}>
                                                out of 5
                                            </Text>
                                        </Box>
                                    </Group>
                                    <Stack gap="xs" align="center">
                                        <Rating value={parseFloat(reviewStats.averageRating)} fractions={2} readOnly size="lg" color="lime"/>
                                        <Text size="md" c="#CCCCCC" fw={500}>
                                            Based on {reviewStats.total} {reviewStats.total === 1 ? "review" : "reviews"}
                                        </Text>
                                    </Stack>
                                </Stack>
                            </Box>
                        )}
                        <Box>
                            <Title order={3} size="1.25rem" c="#FFFFFF" mb="lg" ta="center">
                                What Our Customers Say
                            </Title>
                            {loadingReviews ? (
                                <Center py="xl">
                                    <Loader color="lime" size="lg"/>
                                </Center>
                            ) : reviews.length === 0 ? (
                                <Center py="xl">
                                    <Stack align="center" gap="sm">
                                        <IconStar size={48} color="#666666"/>
                                        <Text c="#666666" size="lg">No reviews yet</Text>
                                        <Text c="#444444" size="sm">Be the first to review this product!</Text>
                                    </Stack>
                                </Center>
                            ) : (
                                <Box style={{overflow: "hidden", position: "relative", padding: "8px 0", maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)", WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent)"}}>
                                    <Box style={{display: "flex", gap: "20px", animation: reviews.length > 2 ? "scroll 40s linear infinite" : "none", width: "max-content", paddingLeft: reviews.length > 2 ? "20px" : "0"}}>
                                        {[...Array(reviews.length > 2 ? 3 : 1)].map((_, duplicateIndex) => (
                                            reviews.map((review, index) => (
                                                <Paper key={`review-${duplicateIndex}-${review.id}-${index}`} radius="md" style={{background: "linear-gradient(135deg, #1a1a1a, #151515)", border: "1px solid #2a2a2a", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", minWidth: "420px", maxWidth: "420px", flex: "0 0 auto", position: "relative", overflow: "hidden"}} onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-8px) scale(1.02)", e.currentTarget.style.borderColor = "#BAF329", e.currentTarget.style.boxShadow = "0 12px 40px rgba(186, 243, 41, 0.15)"}} onMouseLeave={(e) => {e.currentTarget.style.transform = "translateY(0) scale(1)", e.currentTarget.style.borderColor = "#2a2a2a", e.currentTarget.style.boxShadow = "none"}}>
                                                    <Box style={{position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, transparent, #BAF329, transparent)`}}/>
                                                    <Stack gap="lg" p="24px" pt="28px">
                                                        <Group justify="space-between" wrap="nowrap">
                                                            <Group gap="md">
                                                                {review.user_avatar ? (
                                                                    <Avatar src={review.user_avatar} size={56} radius="xl" style={{border: "2px solid rgba(186, 243, 41, 0.3)"}}/>
                                                                ) : (
                                                                    <Avatar size={56} radius="xl" style={{background: "linear-gradient(135deg, rgba(186, 243, 41, 0.3), rgba(186, 243, 41, 0.1))", border: "2px solid rgba(186, 243, 41, 0.3)"}}>
                                                                        <IconUser size={28} color="#BAF329"/>
                                                                    </Avatar>
                                                                )}
                                                                <Stack gap={4}>
                                                                    <Text fw={700} c="#FFFFFF" size="md">
                                                                        {review.user_username}
                                                                    </Text>
                                                                    <Group gap={6}>
                                                                        <Badge size="xs" variant="dot" color="lime" styles={{root: {background: "rgba(186, 243, 41, 0.1)", color: "#BAF329", border: "1px solid rgba(186, 243, 41, 0.3)", textTransform: "none"}}}>
                                                                            Verified Purchase
                                                                        </Badge>
                                                                        <Text size="xs" c="#666666">
                                                                            {formatTimeAgo(review.created_at)}
                                                                        </Text>
                                                                    </Group>
                                                                </Stack>
                                                            </Group>
                                                            <Box style={{background: "linear-gradient(135deg, rgba(186, 243, 41, 0.2), rgba(186, 243, 41, 0.1))", border: "1px solid rgba(186, 243, 41, 0.3)", borderRadius: "8px", padding: "8px 12px", textAlign: "center", minWidth: "60px"}}>
                                                                <Text size="xl" fw={900} c="#BAF329" style={{ lineHeight: 1 }}>
                                                                    {review.rating}
                                                                </Text>
                                                                <Rating value={review.rating} readOnly size="xs" color="lime" mt={4}/>
                                                            </Box>
                                                        </Group>
                                                        <Box style={{background: "rgba(0, 0, 0, 0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "16px"}}>
                                                            <Text c="#DDDDDD" size="sm" style={{lineHeight: 1.7, fontStyle: "italic"}}>
                                                                "{review.review_description}"
                                                            </Text>
                                                        </Box>
                                                    </Stack>
                                                </Paper>
                                            ))
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Stack>
            </Container>
            <Modal opened={showAuthModal} onClose={() => setShowAuthModal(false)} title={<Group><IconShoppingCart size={24} color="#BAF329"/><Text size="lg" fw={700}>Authentication Required</Text></Group>} size="lg" centered padding="xl" radius="sm" styles={{content: {background: "#1a1a1a"}, header: {background: "#1a1a1a", borderBottom: "1px solid #2a2a2a"}, body: {background: "#1a1a1a"}}}>
                <Stack gap="xl">
                    <Stepper active={authStep} color="lime" size="sm" className={styles.authStepper}>
                        <Stepper.Step label="CFX Account" description="Required" icon={<IconUser style={{width: rem(18), height: rem(18)}}/>} completedIcon={<IconCheck style={{width: rem(18), height: rem(18)}}/>}>
                            <Stack gap="md" mt="xl">
                                <Paper p="md" withBorder radius="sm" bg="dark.6">
                                    <Stack gap="xs">
                                        <Group>
                                            <IconUser size={20} color="#BAF329"/>
                                            <Text fw={600}>CFX.re Authentication</Text>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            You need to authenticate with your CFX.re account.
                                        </Text>
                                    </Stack>
                                </Paper>
                                {product && (
                                    <Paper p="sm" withBorder radius="sm" bg="dark.7">
                                        <Group>
                                            <Image src={product.image} w={50} h={50} radius="sm" fallbackSrc="https://placehold.co/50x50?text=P"/>
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={500}>
                                                    {product.name}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {formatPrice(product.total_price, product.currency)}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Paper>
                                )}
                                <Group justify="flex-end" mt="md">
                                    <Button variant="subtle" color="gray" onClick={() => setShowAuthModal(false)} radius="sm">
                                        Cancel
                                    </Button>
                                    <Button color="lime" leftSection={<IconUser size={18}/>} onClick={handleCfxLogin} radius="sm">
                                        Login with CFX
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>
                        <Stepper.Step label="Discord" description="Optional" icon={<IconBrandDiscord style={{width: rem(18), height: rem(18)}}/>} completedIcon={<IconCheck style={{width: rem(18), height: rem(18)}}/>}>
                            <Stack gap="md" mt="xl">
                                <Paper p="md" withBorder radius="sm" bg="dark.6">
                                    <Stack gap="xs">
                                        <Group>
                                            <IconBrandDiscord size={20} color="#BAF329"/>
                                            <Text fw={600}>Discord Authentication</Text>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            This product may require Discord.
                                        </Text>
                                    </Stack>
                                </Paper>
                                {product && (
                                    <Paper p="sm" withBorder radius="sm" bg="dark.7">
                                        <Group>
                                            <Image src={product.image} w={50} h={50} radius="sm" fallbackSrc="https://placehold.co/50x50?text=P"/>
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={500}>
                                                    {product.name}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {formatPrice(product.total_price, product.currency)}
                                                </Text>
                                            </div>
                                        </Group>
                                    </Paper>
                                )}
                                <Group justify="flex-end" mt="md">
                                    <Button variant="subtle" color="gray" onClick={() => setShowAuthModal(false)} radius="sm">
                                        Cancel
                                    </Button>
                                    <Button leftSection={<IconBrandDiscord size={18}/>} onClick={handleDiscordLogin} radius="sm" styles={{root: {background: "#BAF329", color: "#111111", "&:hover": {background: "#a8db25"}}}}>
                                        Login with Discord
                                    </Button>
                                </Group>
                            </Stack>
                        </Stepper.Step>
                    </Stepper>
                </Stack>
            </Modal>
            <Modal opened={selectedImage !== null} onClose={() => setSelectedImage(null)} size="auto" centered withCloseButton={false} padding={0} radius="md" styles={{content: {background: "transparent", boxShadow: "none", maxWidth: "95vw", maxHeight: "90vh"}, body: {padding: 0}}}>
                <Box style={{ position: "relative", display: "inline-block" }}>
                    <Button onClick={() => setSelectedImage(null)} radius="sm" size="md" style={{position: "absolute", top: 16, right: 16, zIndex: 10, background: "#BAF329", color: "#111111", fontWeight: 700, boxShadow: "0 4px 12px rgba(186, 243, 41, 0.4)"}}>
                        <IconX size={24} color="#111111" stroke={3}/>
                    </Button>
                    {selectedImage && (
                        <Image src={selectedImage.url} alt={selectedImage.alt} fit="contain" style={{maxHeight: "85vh", maxWidth: "95vw", display: "block"}}/>
                    )}
                </Box>
            </Modal>
        </Box>
    )
}