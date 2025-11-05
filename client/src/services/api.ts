import type {TebexCategory, TebexPackage, TebexBasket} from "@/types"

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api`

export const tebexApi = {
    async getCategories(): Promise<{data: TebexCategory[]}> {
        const res = await fetch(`${API_BASE}/tebex/categories`)
        if (!res.ok) throw new Error("Failed to fetch categories")
        return res.json()
    },

    async getPackage(id: number): Promise<{data: TebexPackage}> {
        const res = await fetch(`${API_BASE}/tebex/packages/${id}`)
        if (!res.ok) throw new Error("Failed to fetch package")
        return res.json()
    },

    async createBasket(data: {complete_url: string, cancel_url: string, complete_auto_redirect?: boolean, custom?: any, packages?: Array<{package_id: number; quantity: number}>, username?: string, username_id?: string}): Promise<{data: TebexBasket}> {
        const res = await fetch(`${API_BASE}/tebex/baskets`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(data)})
        if (!res.ok) throw new Error("Failed to create basket")
        return res.json()
    },

    async addPackageToBasket(basketIdent: string, payload: {package_id: number; quantity: number; variable_data?: Record<string, any>}): Promise<void> {
        const res = await fetch(`${API_BASE}/tebex/baskets/${basketIdent}/packages`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)})
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}))
            const errorMessage = errorData.details?.detail || errorData.error || "Failed to add package"
            throw new Error(errorMessage)
        }
    },

    async getBasket(basketIdent: string): Promise<{data: TebexBasket}> {
        const res = await fetch(`${API_BASE}/tebex/baskets/${basketIdent}`)
        if (!res.ok) throw new Error("Failed to get basket")
        return res.json()
    },

    async getBasketAuthUrl(basketIdent: string, returnUrl: string): Promise<Array<{name: string; url: string}>> {
        const res = await fetch(`${API_BASE}/tebex/baskets/${basketIdent}/auth?returnUrl=${encodeURIComponent(returnUrl)}`)
        if (!res.ok) throw new Error("Failed to get auth URL")
        return res.json()
    },
}

export const discordApi = {
    async exchangeCode(code: string): Promise<{access_token: string}> {
        const res = await fetch(`${API_BASE}/discord/token`, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({code})})
        if (!res.ok) throw new Error("Failed to exchange code")
        return res.json()
    },
}