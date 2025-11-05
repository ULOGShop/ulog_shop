import {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {Center, Loader, Text, Stack} from "@mantine/core"
import {useAuth} from "@/contexts/AuthContext"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

export default function CFXCallback() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const hasProcessed = useRef(false)
    const {setCfxUser} = useAuth()

    useEffect(() => {
        if (hasProcessed.current) return
        hasProcessed.current = true
        const handleCallback = async () => {
            try {
                const basketIdent = localStorage.getItem("cfx_auth_basket")
                if (!basketIdent) {
                    throw new Error("No basket found")
                }
                const response = await fetch(`${BACKEND_URL}/api/tebex/baskets/${basketIdent}`)
                if (!response.ok) {
                    throw new Error("Failed to fetch basket")
                }
                const data = await response.json()
                const basket = data.data
                if (basket.username_id && basket.username) {
                    const cfxForumAvatar = `https://forum.cfx.re/user_avatar/forum.cfx.re/${basket.username.toLowerCase()}/256/${basket.username_id}_2.png`
                    setCfxUser(basket.username, cfxForumAvatar)
                    localStorage.removeItem("cfx_auth_basket")
                    const returnUrl = localStorage.getItem("auth_return_url") || "/"
                    localStorage.removeItem("auth_return_url")
                    navigate(returnUrl)
                } else {
                    throw new Error("Authentication failed - no username returned")
                }
            } catch (err) {
                setError("Failed to complete CFX authentication")
                setTimeout(() => navigate("/"), 3000)
            }
        }
        handleCallback()
    }, [navigate, setCfxUser])

    return (
        <Center h="100vh" bg="dark.9">
            <Stack align="center" gap="md">
                {error ? (
                    <>
                        <Text c="red" size="xl">{error}</Text>
                        <Text c="dimmed">Redirecting...</Text>
                    </>
                ) : (
                    <>
                        <Loader color="blue" size="lg"/>
                        <Text size="lg" c="dimmed">
                            Authenticating with CFX.re...
                        </Text>
                    </>
                )}
            </Stack>
        </Center>
    )
}