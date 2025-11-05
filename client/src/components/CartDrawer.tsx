import {Drawer, Stack, Text, Group, Button, Image, ActionIcon, Divider, Badge, Paper, Center, Loader, Overlay} from "@mantine/core"
import {IconTrash, IconShoppingCart, IconPackage} from "@tabler/icons-react"
import {useCart} from "@/contexts/CartContext"
import {useAuth} from "@/contexts/AuthContext"
import {tebexApi} from "@/services/api"
import {notifications} from "@mantine/notifications"
import {useState} from "react"

interface Props {
    isOpen: boolean
    onClose: () => void
}

export default function CartDrawer({isOpen, onClose}: Props) {
    const {items, removeItem, totalPrice, clearCart} = useCart()
    const {discordUser} = useAuth()
    const [isProcessing, setIsProcessing] = useState(false)
    const handleCheckout = async () => {
        setIsProcessing(true)
        try {
            const basketRes = await tebexApi.createBasket({complete_url: `${window.location.origin}/checkout/complete`, cancel_url: `${window.location.origin}/products`, complete_auto_redirect: false})
            const basketIdent = basketRes.data.ident
            localStorage.setItem("tebex_basket_ident", basketIdent)
            localStorage.setItem("tebex_pending_items", JSON.stringify(items))
            const returnUrl = `${window.location.origin}/checkout/auth-complete`
            const authLinks = await tebexApi.getBasketAuthUrl(basketIdent, returnUrl)
            if (authLinks && authLinks.length > 0 && authLinks[0].url) {
                await new Promise(resolve => setTimeout(resolve, 500))
                window.location.href = authLinks[0].url
                return
            }
            for (const item of items) {
                const packagePayload: any = {
                    package_id: item.package.id,
                    quantity: item.quantity,
                }
                if (discordUser && discordUser.id) {
                    packagePayload.variable_data = {
                        discord_id: discordUser.id,
                    }
                }
                try {
                    await tebexApi.addPackageToBasket(basketIdent, packagePayload)
                } catch (pkgError) {
                    throw pkgError
                }
            }
            const updatedBasket = await tebexApi.getBasket(basketIdent)
            const checkoutUrl = updatedBasket.data.links?.checkout
            if (!checkoutUrl) {
                throw new Error("Checkout URL not found")
            }
            clearCart()
            notifications.show({title: "Success!", message: "Redirecting to checkout...", color: "green", autoClose: 2000})
            await new Promise(resolve => setTimeout(resolve, 2000))
            window.location.href = checkoutUrl
        } catch (error) {
            notifications.show({title: "Checkout Error", message: error instanceof Error ? error.message : "Failed to open checkout. Please try again.", color: "red", autoClose: 5000})
            setIsProcessing(false)
        }
    }

    return (
        <Drawer opened={isOpen} onClose={onClose} position="right" size="md" offset={8} radius="sm" withCloseButton={true} styles={{content: {backgroundColor: "#111111"}, header: {backgroundColor: "#1a1a1a", borderBottom: "1px solid rgba(186, 243, 41, 0.2)", padding: "1.5rem"}, body: {padding: "1.5rem"}}} title={<Group gap="sm"><ActionIcon size="lg" radius="xl" color="lime" variant="light"><IconShoppingCart size={20}/></ActionIcon><div><Text fw={700} size="lg">Shopping Cart</Text><Text size="xs" c="dimmed">{items.length} {items.length === 1 ? "item" : "items"}</Text></div></Group>}>
            {items.length === 0 ? (
                <Center h="60vh">
                    <Stack align="center" gap="md">
                        <ActionIcon size={80} radius="xl" color="dark.5" variant="light">
                            <IconPackage size={40}/>
                        </ActionIcon>
                        <Stack align="center" gap="xs">
                            <Text size="lg" fw={600} c="dimmed">
                                Your cart is empty
                            </Text>
                            <Text size="sm" c="dimmed" ta="center">
                                Add some products to get started
                            </Text>
                        </Stack>
                    </Stack>
                </Center>
            ) : (
                <Stack gap="xl">
                    <Stack gap="md">
                        {items.map((item) => (
                            <Paper key={item.package.id} p="md" radius="sm" withBorder style={{borderColor: "#2a2a2a", backgroundColor: "#1a1a1a", transition: "all 0.2s ease"}} onMouseEnter={(e) => {e.currentTarget.style.borderColor = "rgba(186, 243, 41, 0.3)"}} onMouseLeave={(e) => {e.currentTarget.style.borderColor = "#2a2a2a"}}>
                                <Group align="flex-start" wrap="nowrap">
                                    {item.package.image ? (
                                        <Image src={item.package.image} w={70} h={70} radius="sm" fit="cover"/>
                                    ) : (
                                        <Center w={70} h={70} bg="dark.5" style={{borderRadius: "8px"}}>
                                            <IconPackage size={30} color="gray"/>
                                        </Center>
                                    )}
                                    <Stack gap="xs" style={{flex: 1}}>
                                        <Text size="sm" fw={600} lineClamp={2} c="#FFFFFF">
                                            {item.package.name}
                                        </Text>
                                        <Group justify="space-between" align="center">
                                            <Group gap="xs">
                                                <Text size="lg" c="#BAF329" fw={900}>
                                                    ${item.package.total_price.toFixed(2)}
                                                </Text>
                                                {item.package.discount > 0 && (
                                                    <Badge color="red" size="sm" variant="filled">-{item.package.discount}%</Badge>
                                                )}
                                            </Group>
                                            <ActionIcon color="red" variant="light" size="lg" radius="sm" onClick={() => removeItem(item.package.id)}>
                                                <IconTrash size={18}/>
                                            </ActionIcon>
                                        </Group>
                                    </Stack>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                    <Divider color="dark.4"/>
                    <Paper p="md" radius="sm" style={{border: "1px solid rgba(186, 243, 41, 0.2)", backgroundColor: "#1a1a1a"}}>
                        <Group justify="space-between" align="center">
                            <div>
                                <Text size="xs" c="#666666" tt="uppercase" fw={600}>
                                    Total
                                </Text>
                                <Text size="xs" c="#666666">
                                    {items.length} {items.length === 1 ? "item" : "items"}
                                </Text>
                            </div>
                            <Text size="xl" fw={900} c="#BAF329">
                                ${totalPrice.toFixed(2)}
                            </Text>
                        </Group>
                    </Paper>
                    <Stack gap="sm">
                        <Button fullWidth size="lg" color="lime" onClick={handleCheckout}>
                            Proceed to Checkout
                        </Button>
                        <Button fullWidth variant="subtle" color="red" onClick={() => {clearCart(), notifications.show({title: "Cart cleared", message: "All items have been removed from your cart", color: "red"})}}>
                            Clear Cart
                        </Button>
                    </Stack>
                </Stack>
            )}
            {isProcessing && (
                <Overlay color="#000" backgroundOpacity={0.85} blur={4} style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000}}>
                    <Center h="100%">
                        <Stack align="center" gap="xl">
                            <Loader size="xl" color="lime" type="dots"/>
                            <Stack align="center" gap="xs">
                                <Text size="xl" fw={700} c="#FFFFFF">
                                    Processing Checkout
                                </Text>
                                <Text size="sm" c="#666666" ta="center" maw={300}>
                                    Please wait while we prepare your order...
                                </Text>
                            </Stack>
                        </Stack>
                    </Center>
                </Overlay>
            )}
        </Drawer>
    )
}