import {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {Center, Loader, Text, Stack} from "@mantine/core"
import {useAuth, User} from "@/contexts/AuthContext"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"

export default function DiscordCallback() {
    const navigate = useNavigate()
    const [error, setError] = useState<string | null>(null)
    const hasProcessed = useRef(false)
    const {setDiscordUser} = useAuth()

    useEffect(() => {
        if (hasProcessed.current) return
        hasProcessed.current = true
        const handleCallback = async () => {
            const params = new URLSearchParams(window.location.search)
            const code = params.get("code")
            const state = params.get("state")
            const savedState = localStorage.getItem("oauth_state")
            if (!code || !state || state !== savedState) {
                setError("Invalid OAuth state")
                setTimeout(() => navigate("/"), 3000)
                return
            }
            localStorage.removeItem("oauth_state")
            try {
                const tokenResponse = await fetch(`${BACKEND_URL}/api/discord/token`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({code}),
                })
                if (!tokenResponse.ok) {
                    const errorData = await tokenResponse.json().catch(() => ({}))
                    throw new Error(errorData.error || "Failed to exchange code for token")
                }
                const tokenData = await tokenResponse.json()
                const accessToken = tokenData.access_token
                const userResponse = await fetch("https://discord.com/api/users/@me", {headers: {Authorization: `Bearer ${accessToken}`}})
                if (!userResponse.ok) {
                    throw new Error("Failed to fetch user data")
                }
                const userData = await userResponse.json()
                const user: User = {
                    id: userData.id,
                    username: userData.username,
                    avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator) % 5}.png`, provider: "discord",
                }
                setDiscordUser(user)
                localStorage.setItem("discord_token", accessToken)
                const returnUrl = localStorage.getItem("auth_return_url") || "/"
                localStorage.removeItem("auth_return_url")
                navigate(returnUrl)
            } catch (err) {
                setError("Failed to authenticate with Discord")
                setTimeout(() => navigate("/"), 3000)
            }
        }
        handleCallback()
    }, [navigate, setDiscordUser])

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
                            Authenticating with Discord...
                        </Text>
                    </>
                )}
            </Stack>
        </Center>
    )
}