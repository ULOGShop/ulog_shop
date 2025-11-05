import {createContext, useContext, useState, useEffect, ReactNode} from "react"
import type {CartItem, TebexPackage} from "@/types"

interface CartContextType {
    items: CartItem[]
    addItem: (pkg: TebexPackage, quantity?: number) => void
    removeItem: (packageId: number) => void
    updateQuantity: (packageId: number, quantity: number) => void
    clearCart: () => void
    totalPrice: number
    totalItems: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({children}: {children: ReactNode}) {
    const [items, setItems] = useState<CartItem[]>(() => {
        const saved = localStorage.getItem("cart")
        return saved ? JSON.parse(saved) : []
    })
    useEffect(() => {localStorage.setItem("cart", JSON.stringify(items))}, [items])
    const addItem = (pkg: TebexPackage, quantity = 1) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.package.id === pkg.id)
            if (existing) {
                return prev.map((item) => item.package.id === pkg.id ? {...item, quantity: item.quantity + quantity} : item)
            }
            return [...prev, {package: pkg, quantity}]
        })
    }
    const removeItem = (packageId: number) => {
        setItems((prev) => prev.filter((item) => item.package.id !== packageId))
    }
    const updateQuantity = (packageId: number, quantity: number) => {
        if (quantity <= 0) {
            removeItem(packageId)
            return
        }
        setItems((prev) =>
            prev.map((item) => item.package.id === packageId ? {...item, quantity} : item)
        )
    }
    const clearCart = () => {
        setItems([])
    }
    const totalPrice = items.reduce((sum, item) => sum + item.package.total_price*item.quantity, 0)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    return (<CartContext.Provider value={{items, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalItems}}>{children}</CartContext.Provider>)
}

export function useCart() {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within CartProvider")
    }
    return context
}