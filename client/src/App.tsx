import {BrowserRouter, Routes, Route} from "react-router-dom"
import {useState} from "react"
import {CartProvider, useCart} from "@/contexts/CartContext"
import {AuthProvider} from "@/contexts/AuthContext"
import {AppShell, ActionIcon} from "@mantine/core"
import {IconShoppingCart} from "@tabler/icons-react"

import Header from "@/components/Header"
import Footer from "@/components/Footer"
import CartDrawer from "@/components/CartDrawer"
import AnimatedBackground from "@/components/AnimatedBackground"
import HomePage from "@/pages/HomePage"
import ProductsPage from "@/pages/ProductsPage"
import ProductDetailsPage from "@/pages/ProductDetailsPage"
import FAQPage from "@/pages/FAQPage"
import CheckoutComplete from "@/pages/CheckoutComplete"
import CheckoutAuthComplete from "@/pages/CheckoutAuthComplete"
import DiscordCallback from "@/pages/auth/DiscordCallback"
import CFXCallback from "@/pages/auth/CFXCallback"

function LayoutWithCart() {
    const [cartOpen, setCartOpen] = useState(false)
    const {totalItems} = useCart()
    return (
        <>
            <AppShell header={{height: 70}} padding={0} style={{position: "relative", zIndex: 10}}>
                <AppShell.Header>
                    <Header/>
                </AppShell.Header>
                <AppShell.Main style={{paddingBottom: "80px"}}>
                    <Routes>
                        <Route path="/" element={<HomePage/>}/>
                        <Route path="/products" element={<ProductsPage/>}/>
                        <Route path="/product/:id" element={<ProductDetailsPage/>}/>
                        <Route path="/faq" element={<FAQPage/>}/>
                    </Routes>
                </AppShell.Main>
            </AppShell>
            <Footer/>
            <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)}/>
            {totalItems > 0 && (
                <div style={{position: "fixed", bottom: "6rem", right: "1.5rem", zIndex: 1000}}>
                    <ActionIcon size={56} radius="xl" onClick={() => setCartOpen(true)} style={{background: "#BAF329", color: "#111111", boxShadow: "0 4px 16px rgba(186, 243, 41, 0.5)", transition: "all 0.2s ease"}} onMouseEnter={(e) => {e.currentTarget.style.transform = "scale(1.1) translateY(-2px)", e.currentTarget.style.boxShadow = "0 6px 20px rgba(186, 243, 41, 0.6)"}} onMouseLeave={(e) => {e.currentTarget.style.transform = "scale(1) translateY(0)", e.currentTarget.style.boxShadow = "0 4px 16px rgba(186, 243, 41, 0.5)"}}>
                        <IconShoppingCart size={24}/>
                    </ActionIcon>
                    <div style={{position: "absolute", top: -6, right: -6, backgroundColor: "#FFFFFF", color: "#111111", borderRadius: "50%", minWidth: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, border: "2px solid #111111", padding: "0 4px", pointerEvents: "none"}}>{totalItems > 9 ? "9+" : totalItems}</div>
                </div>
            )}
        </>
    )
}

function MainApp() {
    return (
        <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <Routes>
                <Route path="/auth/discord/callback" element={<DiscordCallback/>}/>
                <Route path="/auth/cfx/callback" element={<CFXCallback/>}/>
                <Route path="/checkout/complete" element={<CheckoutComplete/>}/>
                <Route path="/checkout/auth-complete" element={<CheckoutAuthComplete/>}/>
                <Route path="/*" element={<LayoutWithCart/>}/>
            </Routes>
        </BrowserRouter>
    )
}

function App() {
    return (
        <>
            <AnimatedBackground/>
            <AuthProvider>
                <CartProvider>
                    <MainApp/>
                </CartProvider>
            </AuthProvider>
        </>
    )
}

export default App