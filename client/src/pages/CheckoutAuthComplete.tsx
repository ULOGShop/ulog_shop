import {useEffect, useState} from "react"
import {Loader, CheckCircle, XCircle} from "lucide-react"
import {Center, Stack, Text, Box} from "@mantine/core"
import {notifications} from "@mantine/notifications"
import {tebexApi} from "@/services/api"

export default function CheckoutAuthComplete() {
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
    const [message, setMessage] = useState("Processing authentication...")

    useEffect(() => {
        window.history.replaceState({}, "", "/checkout/auth-complete")
    }, [])

    useEffect(() => {
        const processingFlag = localStorage.getItem("auth_complete_processing")
        if (processingFlag === "true") {
            return
        }
        localStorage.setItem("auth_complete_processing", "true")
        const handleAuthComplete = async () => {
            const basketIdent = localStorage.getItem("tebex_basket_ident")
            const pendingItems = localStorage.getItem("tebex_pending_items")
            if (!basketIdent || !pendingItems) {
                setStatus("error")
                setMessage("No basket found. Redirecting...")
                notifications.show({title: "Error", message: "No basket found", color: "red"})
                setTimeout(() => {localStorage.removeItem("auth_complete_processing"), window.location.href = "/products"}, 3000)
                return
            }
            try {
                const items = JSON.parse(pendingItems)
                const authStateStr = localStorage.getItem("authState")
                const authState = authStateStr ? JSON.parse(authStateStr) : null
                const discordUser = authState?.discord || null
                if (discordUser) {} else {}
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
                    } catch (pkgError: any) {
                        if (pkgError.message && pkgError.message.includes("already in your basket")) {
                            continue
                        }
                        if (pkgError.message && pkgError.message.includes("Discord")) {
                            throw new Error("This package requires Discord login. Please login with Discord first.")
                        }
                        throw pkgError
                    }
                }

                const basket = await tebexApi.getBasket(basketIdent)
                const checkoutUrl = basket.data.links?.checkout
                if (!checkoutUrl) {
                    throw new Error("Checkout URL not found")
                }
                localStorage.removeItem("tebex_pending_items")
                localStorage.removeItem("tebex_basket_ident")
                localStorage.removeItem("auth_complete_processing")
                setStatus("success")
                setMessage("Redirecting to checkout...")
                notifications.show({title: "Success!", message: "Authentication complete. Redirecting to checkout...", color: "green"})
                await new Promise((resolve) => setTimeout(resolve, 1000))
                window.location.href = checkoutUrl
            } catch (error) {
                setStatus("error")
                setMessage(error instanceof Error ? error.message : "Failed to complete checkout. Please try again.")
                notifications.show({title: "Error", message: error instanceof Error ? error.message : "Failed to complete checkout", color: "red"})
                setTimeout(() => {
                    localStorage.removeItem("auth_complete_processing")
                    window.location.href = "/products"
                }, 3000)
            }
        }
        handleAuthComplete()
    }, [])

    return (
        <Box style={{position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, #000000 0%, #111111 50%, #000000 100%)", zIndex: 9999, overflow: "hidden"}}>
            <Box style={{position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(186, 243, 41, 0.1) 0%, transparent 70%)", animation: "pulse 3s ease-in-out infinite"}}/>
            <Center style={{height: "100vh", position: "relative", zIndex: 1}}>
                <Stack align="center" gap="xl" style={{maxWidth: 500, padding: 32}}>
                    {status === "processing" && (
                        <>
                            <Box style={{position: "relative"}}>
                                <Loader size={100} color="lime" type="dots"/>
                            </Box>
                            <Text size="2.5rem" fw={900} c="#FFFFFF" ta="center" style={{textShadow: "0 0 30px rgba(186, 243, 41, 0.3)", letterSpacing: "-0.5px"}}>
                                Processing Checkout
                            </Text>
                            <Text size="lg" c="#999999" ta="center" maw={400} lh={1.6}>
                                {message}
                            </Text>
                            <Stack align="center" gap="xs" mt="md">
                                <Text size="sm" c="#555555" ta="center">
                                    Please do not close this window
                                </Text>
                                <Box style={{display: "flex", gap: 8, marginTop: 16}}>
                                    <Box style={{width: 8, height: 8, background: "#BAF329", borderRadius: "50%", animation: "bounce 1.4s ease-in-out infinite", animationDelay: "0s"}}/>
                                    <Box style={{width: 8, height: 8, background: "#BAF329", borderRadius: "50%", animation: "bounce 1.4s ease-in-out infinite", animationDelay: "0.2s"}}/>
                                    <Box style={{width: 8, height: 8, background: "#BAF329", borderRadius: "50%", animation: "bounce 1.4s ease-in-out infinite", animationDelay: "0.4s"}}/>
                                </Box>
                            </Stack>
                        </>
                    )}
                    {status === "success" && (
                        <>
                            <Box style={{animation: "scaleIn 0.5s ease-out"}}>
                                <CheckCircle size={100} color="#BAF329" strokeWidth={2}/>
                            </Box>
                            <Text size="2.5rem" fw={900} c="#FFFFFF" ta="center" style={{textShadow: "0 0 30px rgba(186, 243, 41, 0.3)", letterSpacing: "-0.5px"}}>
                                Success!
                            </Text>
                            <Text size="lg" c="#999999" ta="center" lh={1.6}>
                                {message}
                            </Text>
                        </>
                    )}
                    {status === "error" && (
                        <>
                            <Box style={{animation: "shake 0.5s ease-out"}}>
                                <XCircle size={100} color="#ff4444" strokeWidth={2}/>
                            </Box>
                            <Text size="2.5rem" fw={900} c="#FFFFFF" ta="center" style={{textShadow: "0 0 30px rgba(255, 68, 68, 0.3)", letterSpacing: "-0.5px"}}>
                                Error
                            </Text>
                            <Text size="lg" c="#999999" ta="center" maw={400} lh={1.6}>
                                {message}
                            </Text>
                        </>
                    )}
                </Stack>
            </Center>
            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: translate(-50%, -50%) scale(1.1);
                    }
                }
        
                @keyframes bounce {
                    0%, 80%, 100% {
                        transform: translateY(0);
                    }
                    40% {
                        transform: translateY(-10px);
                    }
                }
        
                @keyframes scaleIn {
                    0% {
                        transform: scale(0);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
        
                @keyframes shake {
                    0%, 100% {
                        transform: translateX(0);
                    }
                    10%, 30%, 50%, 70%, 90% {
                        transform: translateX(-10px);
                    }
                    20%, 40%, 60%, 80% {
                        transform: translateX(10px);
                    }
                }
            `}</style>
        </Box>
    )
}