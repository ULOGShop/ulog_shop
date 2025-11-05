import {createContext, useContext, useState, useEffect, ReactNode} from "react"

export interface User {
    id: string
    username: string
    avatar?: string
    provider: "discord" | "cfx"
}

interface AuthState {
    discord: User | null
    cfx: User | null
}

interface AuthContextType {
    discordUser: User | null
    cfxUser: User | null
    login: (provider: "discord" | "cfx") => void | Promise<void>
    logoutDiscord: () => void
    logoutCFX: () => void
    isAuthenticated: boolean
    setCfxUser: (username: string, avatar?: string) => void
    setDiscordUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001"
const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID
const DISCORD_REDIRECT_URI = import.meta.env.VITE_DISCORD_REDIRECT_URI

export function AuthProvider({children}: {children: ReactNode}) {
    const [authState, setAuthState] = useState<AuthState>(() => {
        const saved = localStorage.getItem("authState")
        return saved ? JSON.parse(saved) : {discord: null, cfx: null}
    })

    useEffect(() => {
        localStorage.setItem("authState", JSON.stringify(authState))
    }, [authState])

    const login = async (provider: "discord" | "cfx") => {
        if (provider === "discord") {
            localStorage.setItem("auth_return_url", window.location.pathname)
            const state = Math.random().toString(36).substring(7)
            localStorage.setItem("oauth_state", state)
            localStorage.setItem("oauth_provider", "discord")
            const params = new URLSearchParams({client_id: DISCORD_CLIENT_ID, redirect_uri: DISCORD_REDIRECT_URI, response_type: "code", scope: "identify email guilds.join", state: state})
            window.location.href = `https://discord.com/api/oauth2/authorize?${params.toString()}`
        } else if (provider === "cfx") {
            try {
                const response = await fetch(`${BACKEND_URL}/api/tebex/baskets`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({complete_url: window.location.origin + "/auth/cfx/complete", cancel_url: window.location.origin, complete_auto_redirect: false})})
                if (!response.ok) {
                    throw new Error("Failed to create basket for authentication")
                }
                const basketData = await response.json()
                const basketIdent = basketData.data.ident
                localStorage.setItem("cfx_auth_basket", basketIdent)
                localStorage.setItem("auth_return_url", window.location.pathname)
                const authResponse = await fetch(`${BACKEND_URL}/api/tebex/baskets/${basketIdent}/auth?returnUrl=${encodeURIComponent(window.location.origin + "/auth/cfx/callback")}`)
                if (!authResponse.ok) {
                    throw new Error("Failed to get auth URL")
                }
                const authData = await authResponse.json()
                if (authData && authData.length > 0 && authData[0].url) {
                    window.location.href = authData[0].url
                } else {
                    throw new Error("No auth URL returned")
                }
            } catch (error) {
                alert("Failed to initiate CFX authentication. Please try again.")
            }
        }
    }
    const setCfxUser = (username: string, avatar?: string) => {
        const cfxUser: User = {id: username, username: username, avatar: avatar, provider: "cfx"}
        setAuthState((prev) => ({...prev, cfx: cfxUser}))
    }
    const setDiscordUser = (user: User) => {
        setAuthState((prev) => ({...prev, discord: user}))
    }
    const logoutDiscord = () => {
        setAuthState((prev) => ({...prev, discord: null}))
        localStorage.removeItem("discord_token")
    }
    const logoutCFX = () => {
        setAuthState((prev) => ({...prev, cfx: null}))
    }
    return (<AuthContext.Provider value={{discordUser: authState.discord, cfxUser: authState.cfx, login, logoutDiscord, logoutCFX, isAuthenticated: !!(authState.discord || authState.cfx), setCfxUser, setDiscordUser}}>{children}</AuthContext.Provider>)
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }
    return context
}