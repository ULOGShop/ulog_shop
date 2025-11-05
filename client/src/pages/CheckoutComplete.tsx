import {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {Center, Stack, Text, Button} from "@mantine/core"
import {IconCheck} from "@tabler/icons-react"
import {useCart} from "@/contexts/CartContext"

export default function CheckoutComplete() {
    const navigate = useNavigate()
    const {clearCart} = useCart()

    useEffect(() => {clearCart()}, [])

    return (
        <Center h="100vh">
            <Stack align="center" gap="xl">
                <div style={{width: 80, height: 80, borderRadius: "50%", background: "var(--mantine-color-lime-6)", display: "flex", alignItems: "center", justifyContent: "center"}}>
                    <IconCheck size={48} color="black" stroke={3}/>
                </div>
                <Stack align="center" gap="sm">
                    <Text size="xl" fw={900}>
                        Order Complete!
                    </Text>
                    <Text c="dimmed" ta="center">
                        Your purchase was successful.
                        <br/>
                        You'll receive your items shortly.
                    </Text>
                </Stack>
                <Button size="lg" color="lime" onClick={() => navigate("/products")}>
                    Continue Shopping
                </Button>
            </Stack>
        </Center>
    )
}